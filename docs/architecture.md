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

## Monorepo Layout

```
railskit/
├── api/                          # Rails 8 API-only application
│   ├── app/
│   │   ├── agents/               # RubyLLM agent classes
│   │   ├── tools/                # RubyLLM tool classes (function calling)
│   │   ├── controllers/api/v1/   # Versioned REST endpoints
│   │   ├── models/               # ActiveRecord models (User, Plan, Chat, etc.)
│   │   ├── channels/             # ActionCable channels (AgentChannel)
│   │   ├── jobs/                 # Solid Queue background jobs
│   │   ├── mailers/              # Transactional email templates
│   │   ├── services/             # Business logic (StripeService, EmailService)
│   │   └── adapters/             # Database adapters (Postgres, Supabase, Convex)
│   ├── config/
│   │   ├── routes.rb             # API route definitions
│   │   ├── railskit.yml          # Generated config (from root railskit.yml)
│   │   ├── database.yml          # Database connection
│   │   ├── cable.yml             # ActionCable adapter config
│   │   └── puma.rb               # Web server config
│   ├── db/
│   │   ├── migrate/              # Schema migrations
│   │   └── seeds.rb              # Seed data (plans, demo user)
│   └── Gemfile
├── web/                          # React + Vite standalone SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/               # shadcn/ui primitives (Button, Card, Dialog)
│   │   │   ├── landing/          # Landing page sections (Hero, Pricing, FAQ)
│   │   │   └── dashboard/        # Dashboard (Sidebar, StatCard, AgentDashboard)
│   │   ├── pages/                # Route-level page components
│   │   ├── hooks/                # Custom hooks (useAuth, useUser, useAgent)
│   │   ├── lib/
│   │   │   ├── api.ts            # Axios wrapper with auth handling
│   │   │   └── config.ts         # Frontend config (mirrors railskit.yml)
│   │   └── stores/               # Zustand stores (UI theme, sidebar)
│   ├── package.json
│   └── vite.config.ts            # Dev server + /api proxy to Rails
├── railskit.yml                  # Root config — source of truth
├── bin/setup                     # Interactive setup wizard
├── bin/dev                       # Start dev server (foreman/overmind)
├── bin/deploy                    # Deploy helper
├── Procfile.dev                  # Process definitions for dev
├── Dockerfile.production         # Multi-stage production build
├── render.yaml                   # Render blueprint
└── fly.toml                      # Fly.io config
```

---

## The Three Layers

`railskit.yml` at the project root is the single source of truth. It's read by:

A Rails 8 API-only application. No views, no asset pipeline. Pure JSON API.

**Request flow:**

```
HTTP Request → Rack Middleware (CORS, cookies) → Router → Controller → Service/Model → JSON Response
```

Authentication uses Devise with JWT stored in httpOnly cookies. Every authenticated request includes the cookie automatically — no `Authorization` header management on the frontend.

**Key API endpoints:**

```
POST   /api/v1/auth/sign_in          # Login → sets JWT cookie
POST   /api/v1/auth/sign_up          # Register
DELETE /api/v1/auth/sign_out          # Logout → clears cookie
GET    /api/v1/me                     # Current user
GET    /api/v1/plans                  # List plans
POST   /api/v1/checkout               # Create Stripe checkout session
POST   /api/v1/webhooks/stripe        # Stripe webhooks
GET    /api/v1/chats                  # List conversations
POST   /api/v1/chats                  # Start new conversation
GET    /api/v1/chats/:id/messages     # Conversation history
GET    /api/health                    # Health check
```

### 2. React Frontend (`web/`)

Standalone React + Vite app. Completely decoupled — communicates only via API calls and WebSockets.

**Data flow:**

```
Component → useQuery hook → api.ts (Axios) → Rails API → JSON → TanStack Query cache → Re-render
```

Server state lives in TanStack Query's cache. Client-only state (theme, sidebar) lives in Zustand stores. This separation means you never mix API data with UI state.

**Vite proxy:** In development, Vite proxies `/api` requests to Rails on port 3000 — no CORS issues locally.

### 3. AI Agent Layer

Bridges Rails and LLM providers via RubyLLM. Lives inside the Rails app (`app/agents/` and `app/tools/`).

**Agent request flow:**

```
User sends message (React)
  → WebSocket to AgentChannel (ActionCable)
  → Loads Chat (acts_as_chat — persisted conversation)
  → Dispatches to Agent class
  → Agent calls LLM provider API
  → LLM may invoke Tools (function calling)
  → Tool executes Ruby code (DB query, API call, etc.)
  → Tool result sent back to LLM
  → LLM generates final response
  → Response streams back chunk-by-chunk via ActionCable
  → React renders each chunk as it arrives
```

Every message, tool call, token count, and cost is automatically persisted via RubyLLM's `acts_as_chat` model concern.

---

## Authentication Flow

```
1. User submits login form (React)
2. POST /api/v1/auth/sign_in → email + password
3. Devise validates credentials, generates JWT
4. JWT returned in Set-Cookie (httpOnly, Secure, SameSite=Strict)
5. All subsequent requests include cookie automatically
6. Rails middleware extracts JWT → loads current_user
7. Logout: DELETE /api/v1/auth/sign_out → clears cookie
```

**Why httpOnly cookies:** Immune to XSS. JavaScript can never read the token. The browser sends it automatically. This is the secure default.

---

## Database Adapter Pattern

The `DatabaseAdapter` module provides a pluggable CRUD interface:

```
api/app/adapters/
├── convex_adapter.rb       # HTTP-based adapter for Convex
├── supabase_adapter.rb     # Postgres + Supabase-specific features
└── postgres_adapter.rb     # Standard ActiveRecord/PostgreSQL
```

| Feature | PostgreSQL | Supabase | Convex |
|---|---|---|---|
| Real-time | ActionCable | Built-in | Built-in |
| Migrations | SQL | SQL | Schema definitions |
| Hosting | Self-managed | Managed | Managed |
| Best for | Full control | Postgres + hosted | Speed, prototyping |

Standard ActiveRecord works for PostgreSQL and Supabase. Convex uses a thin HTTP adapter. The adapter pattern isolates database-specific code so switching backends only requires changing `railskit.yml` — application code stays the same.

**Accessing config in Rails:**

```ruby
RailsKit.config.database.adapter    # => "postgresql"
RailsKit.config.app.name            # => "My App"
RailsKit.config.ai.default_model    # => "claude-sonnet-4"
```

---

## Frontend Architecture

Solid Queue (Rails 8 default) uses the database as the queue backend. No Redis required for basic usage.

| Path | Component | Auth Required |
|---|---|---|
| `StripeWebhookJob` | Stripe webhook | Process payment events |
| `WelcomeEmailJob` | User registration | Send welcome email |
| `AgentCostTrackingJob` | Agent response | Aggregate token costs |

**Single-server shortcut:** Set `SOLID_QUEUE_IN_PUMA=true` to run the job worker inside the Puma process — one fewer process to manage in production.

**When to upgrade:** If you're processing >1,000 jobs/minute, switch to Sidekiq + Redis. See the [Scaling Guide](scaling.md).

---

## WebSocket / Real-Time

ActionCable handles WebSocket connections for:

- **Agent streaming** — LLM response chunks broadcast as they arrive
- **Presence** (v2) — who's online
- **Notifications** (v2) — in-app push

The React app connects via `@rails/actioncable` and subscribes to channels. The `useAgent` hook manages subscription lifecycle, chunk appending, and optimistic UI.

**Scaling WebSockets:** Default uses Solid Cable (database-backed). For 500+ concurrent connections, switch to Redis adapter. For 10,000+, use AnyCable (Go-based WebSocket server). See [Scaling Guide](scaling.md).

`AuthContext` wraps the app and provides: `user`, `signIn`, `signUp`, `signOut`, `requestMagicLink`, `verifyMagicLink`, `updateProfile`, `refreshUser`.

The `AuthGuard` component protects routes that require authentication.

Since API and frontend run on different ports (and potentially different domains in production):

```ruby
# config/initializers/cors.rb
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins ENV.fetch("FRONTEND_URL", "http://localhost:5173")
    resource "/api/*",
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options],
      credentials: true  # Required for httpOnly cookies cross-origin
  end
end
```

### API Client

---

## Dev Environment

`bin/dev` starts everything via foreman or overmind:

```bash
# Procfile.dev
api: cd api && bin/rails server -p 3000
web: cd web && npm run dev
```

- **Frontend HMR:** Vite hot module replacement — instant updates on save
- **Rails reload:** Auto-reloads on file changes in development
- **API proxy:** Vite proxies `/api` → `localhost:3000` — no CORS issues locally

---

## Production Build

`Dockerfile.production` uses a multi-stage build:

1. **Stage 1 (frontend-build):** Node 22 — `npm ci` + `npm run build` for React/Vite
2. **Stage 2 (production):** Ruby 3.3-slim — installs gems, copies built frontend into `public/web/`, runs Rails with Thruster

Features:
- **jemalloc** for better memory management
- **Non-root user** for security
- **Bootsnap precompilation** for fast boot
- **`db:prepare` on entrypoint** — creates or migrates automatically
- **~250MB final image**

The production build serves the React SPA from Rails' `public/web/` directory — single deployment, single domain, no CORS in production.
