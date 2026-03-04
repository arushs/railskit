# Architecture Overview

RailsKit is a monorepo with two apps and a shared configuration layer.

---

## High-Level Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  Browser (React 19 + Vite)          http://localhost:5173   │
│  ├── Auth flows (sign up, login, magic link, Google OAuth)  │
│  ├── Dashboard (billing, settings)                          │
│  ├── Landing page (hero, pricing, FAQ)                      │
│  └── Agent chat UI (HelpDeskChat, custom agents)            │
└────────────────┬─────────────────────┬──────────────────────┘
                 │ HTTP (JSON)         │ WebSocket
                 ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Rails 8 API                        http://localhost:3000   │
│  ├── /api/auth/*        Devise + JWT auth                   │
│  ├── /api/plans         Plan listing                        │
│  ├── /api/checkout      Stripe Checkout session             │
│  ├── /api/billing-portal Stripe Customer Portal             │
│  ├── /api/webhooks/stripe  Stripe webhook handler           │
│  ├── /api/agents/:name/chat   Non-streaming agent chat      │
│  ├── /api/agents/:name/stream Streaming agent chat          │
│  └── ActionCable (AgentChatChannel) WebSocket streaming     │
├─────────────────────────────────────────────────────────────┤
│  AI Layer (RubyLLM)                                         │
│  ├── Agent classes (app/agents/)                            │
│  ├── Tool classes (app/tools/)                              │
│  └── Schemas (app/schemas/) for structured output           │
├─────────────────────────────────────────────────────────────┤
│  Data Layer                                                 │
│  ├── PostgreSQL (default) / Supabase / Convex               │
│  ├── Solid Queue (background jobs)                          │
│  ├── Solid Cable (ActionCable adapter)                      │
│  └── Solid Cache (Rails.cache)                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Configuration Flow

`railskit.yml` at the project root is the single source of truth. It's read by:

1. **`RailsKit` module** (`api/config/initializers/railskit.rb`) — provides `RailsKit.config` with dot-notation access
2. **Frontend config** (`web/src/config.ts`) — imports a generated JSON file or falls back to defaults
3. **Initializers** — `ruby_llm.rb`, `stripe.rb`, `email.rb`, `database_adapter.rb` all read from `RailsKit.config`

```ruby
# Accessing config in Rails
RailsKit.config.app.name        # => "RailsKit"
RailsKit.config.ai.provider     # => "openai"
RailsKit.config.ai.model        # => "gpt-4o"
RailsKit.config.auth.provider   # => "devise"
RailsKit.config.payments.provider # => "stripe"
```

Generate the frontend JSON config:
```bash
cd api && bin/rails railskit:generate_frontend_config
# Writes web/src/railskit.generated.json
```

---

## Authentication

Default: **Devise + JWT** with httpOnly cookies.

### Flow

1. Client POSTs to `/api/auth/login` with `{ user: { email, password } }`
2. Devise authenticates, `devise-jwt` generates a JWT
3. The `JwtCookie` concern sets an httpOnly cookie (`jwt`) on the response
4. Subsequent requests include the cookie automatically
5. `ApplicationController#set_jwt_from_cookie` copies it to the `Authorization` header for Devise-JWT

### Auth Methods

| Method | Endpoint | Description |
|---|---|---|
| Email/password signup | `POST /api/auth/signup` | Creates user, returns JWT |
| Email/password login | `POST /api/auth/login` | Returns JWT |
| Logout | `DELETE /api/auth/logout` | Revokes JWT (denylist), clears cookie |
| Current user | `GET /api/auth/me` | Returns user profile |
| Google OAuth | `GET /api/auth/users/auth/google_oauth2` | Redirects to Google, then `/auth/callback` |
| Magic link request | `POST /api/auth/magic_link` | Sends email with login link |
| Magic link verify | `POST /api/auth/magic_link/verify` | Exchanges token for JWT |

### Pluggable Providers

Auth providers are defined in `lib/auth_providers/`. The default is `DeviseJwtProvider`. Supabase and Clerk provider stubs exist — implement the `Base` interface to swap.

Set via `railskit.yml`:
```yaml
auth:
  provider: "devise"    # devise | supabase | clerk
  google_oauth: true
  magic_links: true
```

---

## AI Agent Architecture

Agents are plain Ruby classes in `app/agents/`. They use RubyLLM for LLM interaction.

### Request Flow (Non-Streaming)

```
Client POST /api/agents/help_desk/chat { message: "..." }
  → AgentsController#chat
    → HelpDeskAgent.new(conversation:).ask(message)
      → RubyLLM.chat.ask(message)   # calls OpenAI/Anthropic/etc.
    ← response.content
  ← JSON { response, conversation_id, model, usage }
```

### Request Flow (Streaming)

```
Client POST /api/agents/help_desk/stream { message: "..." }
  → AgentsController#stream_chat
    → Persists user message
    → Enqueues AgentStreamJob
  ← JSON { conversation_id }

Client subscribes to AgentChatChannel (WebSocket)

AgentStreamJob runs:
  → agent.stream(message) { |chunk| broadcast chunk }
  → Broadcasts: stream_start → stream_token* → stream_end
  → Persists full assistant message
```

### Conversation Persistence

- **Chat** model — represents a conversation. Has `agent_class`, `model_id`, optional `user` reference
- **Message** model — belongs to Chat. Stores `role` (system/user/assistant/tool), `content`, `input_tokens`, `output_tokens`, `tool_calls`, `tool_result`
- **ActsAsChat** concern — provides `to_llm_chat` (reconstructs RubyLLM chat from persisted messages), `persist_message`, `persist_exchange`
- Both use UUID primary keys

---

## Payments

Stripe is the default. The flow:

1. `GET /api/plans` — returns available plans (seeded from `db/seeds/plans.rb`)
2. `POST /api/checkout` — creates Stripe Checkout Session, returns redirect URL
3. User completes payment on Stripe
4. `POST /api/webhooks/stripe` — handles `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
5. Creates/updates `Subscription` records

Models: `Plan` (name, slug, stripe_price_id, interval, amount_cents, features JSONB) and `Subscription` (links user + plan + Stripe IDs + status).

A `Billable` concern provides `user.active_subscription`, `user.subscribed?`, `user.feature?(:key)`.

---

## Email

Adapter-based delivery via `EmailProvider`. Three providers ship:

| Provider | How it works |
|---|---|
| Resend | SMTP relay (no extra gem needed) |
| Postmark | SMTP relay |
| SMTP | Bring your own server |

Configured in `railskit.yml`:
```yaml
email:
  provider: "resend"   # resend | postmark | smtp
```

Mailers included: `MagicLinkMailer`, `TransactionalMailer` (invoice receipt, subscription confirmation), `UserMailer` (welcome, password reset, magic link).

In development, `letter_opener` opens emails in the browser.

---

## Database Adapters

The `DatabaseAdapter` module provides a pluggable CRUD interface:

| Adapter | How it works |
|---|---|
| PostgreSQL | Thin wrapper around ActiveRecord |
| Supabase | Calls Supabase PostgREST API via HTTP |
| Convex | Calls Convex HTTP API |

Set in `railskit.yml`:
```yaml
database:
  adapter: "postgresql"   # postgresql | supabase | convex
```

**Note:** ActiveRecord models (User, Chat, Message, Plan, Subscription) use standard Rails migrations and work directly with PostgreSQL. The adapter layer is for custom tables where you want database-agnostic access.

The migration generator is adapter-aware:
```bash
bin/rails generate migration CreateProducts name:string price:decimal
# PostgreSQL → standard ActiveRecord migration
# Supabase  → raw SQL migration file
# Convex    → TypeScript schema stub
```

---

## Frontend Architecture

React 19 + Vite 7 + TailwindCSS v4 + React Router.

### Key Routes

| Path | Component | Auth Required |
|---|---|---|
| `/` | LandingPage | No |
| `/login` | SignInPage | No |
| `/signup` | SignUpPage | No |
| `/auth/magic-link` | MagicLinkPage | No |
| `/auth/magic-link/verify` | MagicLinkVerifyPage | No |
| `/auth/callback` | OAuthCallbackPage | No |
| `/dashboard` | DashboardPage | Yes |
| `/dashboard/settings` | SettingsPage | Yes |
| `/dashboard/billing` | BillingPage | Yes |
| `/agents` | DashboardOverview | No |
| `/agents/conversations` | ConversationList | No |
| `/agents/conversations/:id` | ConversationView | No |
| `/agents/costs` | CostTracking | No |
| `/agents/tools` | ToolUsage | No |

### Auth Context

`AuthContext` wraps the app and provides: `user`, `signIn`, `signUp`, `signOut`, `requestMagicLink`, `verifyMagicLink`, `updateProfile`, `refreshUser`.

The `AuthGuard` component protects routes that require authentication.

### Agent Streaming Hook

`useAgentStream` handles the full streaming lifecycle:
1. POSTs to `/api/agents/:name/stream`
2. Subscribes to `AgentChatChannel` via ActionCable
3. Receives `stream_start` → `stream_token*` → `stream_end` events
4. Provides `sendMessage`, `isStreaming`, `streamContent` to components

### API Client

`web/src/lib/api.ts` provides a typed HTTP client that:
- Prefixes all paths with `VITE_API_URL`
- Sends `credentials: "include"` for httpOnly cookie auth
- Exports `authApi` with methods for all auth endpoints
