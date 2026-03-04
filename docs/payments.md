# Payments — Stripe Integration

RailsKit ships with full Stripe subscription billing.

## Setup

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=http://localhost:5173
```

```bash
cd api && rails db:migrate && rails db:seed
```

For local webhooks: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/plans` | No | List active plans |
| POST | `/api/checkout` | Yes | Create Checkout session |
| POST | `/api/billing-portal` | Yes | Customer Portal session |
| POST | `/api/webhooks/stripe` | Stripe sig | Webhook receiver |

## Models

**Plan** — name, slug, stripe_price_id, interval, amount_cents, features (JSONB), active, sort_order

**Subscription** — user, plan, stripe_subscription_id, stripe_customer_id, status, period dates

### Billable Concern

```ruby
class User < ApplicationRecord
  include Billable
end

user.subscribed?        # => true/false
user.current_plan       # => Plan
user.feature?("rbac")   # => true/false
```

## Webhook Events

- `checkout.session.completed` → creates Subscription record
- `customer.subscription.updated` → syncs status, plan changes, period dates
- `customer.subscription.deleted` → marks canceled
- `invoice.payment_failed` → marks past_due

## Lemon Squeezy (Stub)

`app/services/payment_provider/lemon_squeezy_adapter.rb` implements the same `PaymentProvider::Base` interface. Set `payments.provider: lemon_squeezy` in `railskit.yml` to switch.
