# Architecture Overview

RailsKit is a monorepo with three layers: a **Rails API backend**, a **React frontend**, and an **AI agent layer** powered by RubyLLM. They communicate over HTTP and WebSockets.

---

## High-Level Architecture

```
┌──────────────────────────────────────────────────────────┐
│                        Client                            │
│                   React + Vite (web/)                     │
│                                                          │
│  ┌────────────┐  ┌────────────┐  ┌─────────────────┐   │
│  │ TanStack   │  │  Zustand   │  │  ActionCable    │   │
│  │ Query      │  │  Store     │  │  Consumer       │   │
│  │ (API data) │  │ (UI state) │  │ (streaming)     │   │
│  └─────┬──────┘  └────────────┘  └────────┬────────┘   │
│        │                                    │            │
└────────┼────────────────────────────────────┼────────────┘
         │ HTTP (REST/JSON)                   │ WebSocket
         │ JWT in httpOnly cookie             │
┌────────┼────────────────────────────────────┼────────────┐
│        ▼                                    ▼            │
│  ┌────────────┐                    ┌──────────────┐     │
│  │ Controllers│                    │ ActionCable  │     │
│  │ /api/v1/*  │                    │ Channels     │     │
│  └─────┬──────┘                    └──────┬───────┘     │
│        │                                   │             │
│  ┌─────┴──────────────────────────────────┴──────┐      │
│  │              Rails Application                 │      │
│  │                                                │      │
│  │  Models  │  Services  │  Agents  │  Tools     │      │
│  │  (AR)    │  (biz)     │  (LLM)   │  (fn call) │      │
│  └─────┬──────────────────────┬───────────────────┘      │
│        │                      │                          │
│  ┌─────▼──────┐   ┌──────────▼──────────┐              │
│  │  Database  │   │  LLM Providers      │              │
│  │  Adapter   │   │  (OpenAI, Anthropic, │              │
│  │            │   │   Google, Ollama)    │              │
│  └────────────┘   └─────────────────────┘              │
│                                                          │
│                   Rails 8 API (api/)                      │
└──────────────────────────────────────────────────────────┘
```

---

## The Three Layers

### 1. Rails API (`api/`)

A Rails 8 API-only application. No views, no asset pipeline, no Sprockets. Pure JSON API.

**Key directories:**

| Path | Purpose |
|---|---|
| `app/controllers/api/v1/` | Versioned API endpoints |
| `app/models/` | ActiveRecord models (User, Plan, Subscription, Chat) |
| `app/agents/` | RubyLLM agent classes |
| `app/tools/` | RubyLLM tool classes (function calling) |
| `app/services/` | Business logic (StripeService, EmailService) |
| `app/jobs/` | Background jobs via Solid Queue |
| `app/mailers/` | Transactional email templates |
| `app/channels/` | ActionCable channels for real-time streaming |
| `config/railskit.yml` | Generated configuration (from root `railskit.yml`) |

**Request flow:**

```
HTTP Request → Rack Middleware → Router → Controller → Service/Model → JSON Response
```

Authentication is handled by Devise with JWT tokens stored in httpOnly cookies. Every authenticated request includes the cookie automatically — no `Authorization` header management on the frontend.

### 2. React Frontend (`web/`)

A standalone React + Vite application. Completely decoupled from Rails — communicates only via API calls and WebSockets.

**Key directories:**

| Path | Purpose |
|---|---|
| `src/components/ui/` | shadcn/ui primitives (Button, Card, Dialog) |
| `src/components/landing/` | Landing page sections (Hero, Pricing, FAQ) |
| `src/components/dashboard/` | Dashboard components (Sidebar, StatCard) |
| `src/pages/` | Route-level page components |
| `src/hooks/` | Custom hooks (`useAuth`, `useUser`, `useAgent`) |
| `src/lib/api.ts` | Axios wrapper with auth handling |
| `src/lib/config.ts` | Frontend config (mirrors railskit.yml) |
| `src/stores/` | Zustand stores (UI state, theme) |

**Data flow:**

```
Component → useQuery hook → api.ts (Axios) → Rails API → Response → TanStack Query cache → Re-render
```

Server state lives in TanStack Query's cache. Client-only state (theme, sidebar open/closed) lives in Zustand stores. This separation means you never mix API data with UI state.

### 3. AI Agent Layer

The agent layer bridges Rails and LLM providers via RubyLLM.

**How agents work:**

```
User sends message
    → AgentChannel receives via WebSocket
    → Loads Chat (acts_as_chat)
    → Dispatches to Agent class
    → Agent calls LLM provider
    → LLM may invoke Tools (function calling)
    → Tool executes (DB query, API call, etc.)
    → Response streams back chunk-by-chunk
    → ActionCable broadcasts chunks to React
    → React renders streaming response
```

**Conversation persistence:**

Every conversation is stored in the database via RubyLLM's `acts_as_chat`. The `Chat` model automatically tracks messages, tool calls, token usage, and costs. This works across all database backends (Convex, Supabase, PostgreSQL).

---

## API Communication

### REST Endpoints

All API endpoints are versioned under `/api/v1/`:

```
POST   /api/v1/auth/sign_in          # Login
POST   /api/v1/auth/sign_up          # Register
DELETE /api/v1/auth/sign_out          # Logout
GET    /api/v1/me                     # Current user
PATCH  /api/v1/me                     # Update profile
GET    /api/v1/plans                  # List plans
POST   /api/v1/checkout               # Create Stripe checkout session
POST   /api/v1/webhooks/stripe        # Stripe webhooks
GET    /api/v1/chats                  # List conversations
POST   /api/v1/chats                  # Start new conversation
GET    /api/v1/chats/:id/messages     # Conversation history
GET    /api/health                    # Health check
```

### WebSocket (ActionCable)

Used for real-time features:

- **Agent streaming** — LLM response chunks broadcast as they arrive
- **Presence** — (v2) who's online
- **Notifications** — (v2) in-app notifications

The React app connects via `@rails/actioncable` and subscribes to channels. The Vite dev server proxies `/api` requests to Rails on port 3000.

### Authentication Flow

```
1. User submits login form (React)
2. POST /api/v1/auth/sign_in with email + password
3. Rails validates via Devise, generates JWT
4. JWT returned in Set-Cookie header (httpOnly, Secure, SameSite=Strict)
5. All subsequent requests include cookie automatically
6. Rails middleware extracts JWT, loads user
7. Logout: DELETE /api/v1/auth/sign_out clears the cookie
```

**Why httpOnly cookies over localStorage:** Immune to XSS attacks. The JavaScript can never read the token — the browser handles it automatically. This is the secure default.

---

## Database Adapters

RailsKit supports three database backends. The choice is made during `bin/setup` and stored in `railskit.yml`.

```
app/adapters/
├── convex_adapter.rb
├── supabase_adapter.rb
└── postgres_adapter.rb
```

| Feature | Convex | Supabase | PostgreSQL |
|---|---|---|---|
| Real-time | Built-in | Built-in | ActionCable |
| Migrations | Schema definitions | SQL migrations | SQL migrations |
| Hosting | Managed (convex.dev) | Managed (supabase.com) | Self-managed |
| Best for | Speed, prototyping | Postgres + hosted | Full control |

Models use the adapter layer for database-specific operations. Standard ActiveRecord works for Postgres and Supabase. Convex uses a thin HTTP adapter.

---

## Background Jobs

Solid Queue (Rails 8 default) handles background processing using the database as the queue backend. No Redis required.

**Common jobs:**

| Job | Trigger | Purpose |
|---|---|---|
| `StripeWebhookJob` | Stripe webhook | Process payment events |
| `WelcomeEmailJob` | User registration | Send welcome email |
| `AgentCostTrackingJob` | Agent response complete | Aggregate token costs |

**When to upgrade to Sidekiq + Redis:** If you're processing more than ~1000 jobs/minute. See the [Scaling Guide](scaling.md).

---

## CORS Configuration

Since the API and frontend run on different ports (and potentially different domains in production), CORS is configured in `config/initializers/cors.rb`:

```ruby
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins ENV.fetch("FRONTEND_URL", "http://localhost:5173")
    resource "/api/*",
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options],
      credentials: true  # Required for httpOnly cookies
  end
end
```

The `credentials: true` setting is critical — without it, cookies won't be sent cross-origin.

---

## Dev Environment

`bin/dev` starts everything via foreman/overmind:

```
# Procfile.dev
api: cd api && bin/rails server -p 3000
web: cd web && npx vite --port 5173
worker: cd api && bin/rails solid_queue:start
```

Hot module replacement (HMR) works on the React side via Vite. Rails reloads on file changes automatically in development. Vite proxies `/api` requests to Rails so you don't deal with CORS locally.
