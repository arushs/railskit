# Payments — Stripe Integration

RailsKit ships with full Stripe subscription billing — checkout, customer portal, webhooks, and plan management.

---

## Setup

### 1. Get Your Stripe Keys

From [Stripe Dashboard](https://dashboard.stripe.com/apikeys):

```bash
# .env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 2. Create Products & Prices in Stripe

Create your subscription plans in the Stripe Dashboard, then update the seed data with your actual price IDs.

### 3. Seed Plans

Edit `api/db/seeds/plans.rb` with your Stripe price IDs:

```ruby
plans = [
  {
    name: "Starter", slug: "starter",
    stripe_price_id: "price_your_starter_id",  # Replace with real Stripe price ID
    interval: "month", amount_cents: 0, sort_order: 0,
    features: { "monorepo" => true, "docker" => true, "community_support" => true }
  },
  {
    name: "Pro Monthly", slug: "pro-monthly",
    stripe_price_id: "price_your_pro_monthly_id",
    interval: "month", amount_cents: 4900, sort_order: 1,
    features: { "auth" => true, "stripe" => true, "admin_dashboard" => true,
                "email_templates" => true, "priority_support" => true }
  },
  {
    name: "Pro Annual", slug: "pro-annual",
    stripe_price_id: "price_your_pro_annual_id",
    interval: "year", amount_cents: 3900, sort_order: 2,
    features: { "auth" => true, "stripe" => true, "admin_dashboard" => true,
                "email_templates" => true, "priority_support" => true }
  }
]
```

Run seeds:
```bash
cd api && bin/rails db:seed
```

---

## How It Works

### Plan Model

`Plan` stores pricing and feature flags:

```ruby
plan = Plan.find_by(slug: "pro-monthly")
plan.name              # "Pro Monthly"
plan.stripe_price_id   # "price_pro_monthly"
plan.interval          # "month"
plan.amount_cents      # 4900
plan.display_price     # "$49.0/month"
plan.free?             # false
plan.feature?("auth")  # true
plan.feature_value("max_projects")  # returns the value, or nil
```

Scopes: `Plan.active`, `Plan.ordered`

### Subscription Model

`Subscription` links a user to a plan via Stripe:

```ruby
sub = user.subscriptions.active.first
sub.plan               # => Plan
sub.stripe_subscription_id  # "sub_..."
sub.stripe_customer_id      # "cus_..."
sub.status                  # "active", "trialing", "past_due", "canceled"
sub.active?                 # true
sub.feature?("admin_dashboard")  # delegates to plan
```

### Billable Concern

Include in your User model for convenient methods:

```ruby
class User < ApplicationRecord
  include Billable
  # ...
end

user.subscribed?           # has active subscription?
user.active_subscription   # latest active Subscription
user.current_plan          # the Plan object
user.feature?("key")       # check plan feature
user.stripe_customer_id    # from subscriptions
```

---

## API Endpoints

### List Plans (Public)

```bash
GET /api/plans
```

Response:
```json
{
  "plans": [
    {
      "id": 1,
      "name": "Starter",
      "slug": "starter",
      "stripe_price_id": "price_starter_free",
      "interval": "month",
      "amount_cents": 0,
      "currency": "usd",
      "features": { "monorepo": true, "docker": true },
      "display_price": "Free"
    }
  ]
}
```

### Create Checkout Session (Authenticated)

```bash
POST /api/checkout
{ "price_id": "price_pro_monthly" }
```

Response:
```json
{ "url": "https://checkout.stripe.com/..." }
```

Redirect the user to this URL. After payment, Stripe redirects to `FRONTEND_URL/billing?session_id=...`.

### Create Billing Portal (Authenticated)

```bash
POST /api/billing-portal
```

Response:
```json
{ "url": "https://billing.stripe.com/..." }
```

Redirect the user to manage their subscription (upgrade, downgrade, cancel, update payment method).

---

## Webhook Handling

`POST /api/webhooks/stripe` handles these events:

| Event | Action |
|---|---|
| `checkout.session.completed` | Creates `Subscription` record, links user + plan |
| `customer.subscription.updated` | Updates status, period, plan changes |
| `customer.subscription.deleted` | Marks subscription as canceled |
| `invoice.payment_failed` | Marks subscription as past_due |

### Testing Webhooks Locally

Use the Stripe CLI:

```bash
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
# Copy the webhook signing secret to .env as STRIPE_WEBHOOK_SECRET
```

---

## Frontend Integration

The billing page at `/dashboard/billing` shows:
- Current plan and status
- "Upgrade" button → redirects to Stripe Checkout
- "Manage Billing" button → redirects to Stripe Customer Portal

```typescript
// Create checkout session
const res = await api.post<{ url: string }>("/api/checkout", {
  price_id: plan.stripe_price_id
});
if (res.ok) window.location.href = res.data.url;

// Open billing portal
const res = await api.post<{ url: string }>("/api/billing-portal");
if (res.ok) window.location.href = res.data.url;
```

---

## Lemon Squeezy (Coming Soon)

The `PaymentProvider` adapter pattern supports alternative payment providers. `railskit.yml` accepts `lemon_squeezy` as a payment provider, and the setup wizard collects `LEMONSQUEEZY_API_KEY` and `LEMONSQUEEZY_WEBHOOK_SECRET`. The Lemon Squeezy adapter implementation is planned for a future release.
