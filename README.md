# RailsKit

**Ship your AI-powered SaaS in a weekend.** Rails 8 API + React 19 + Vite + RubyLLM. No framework lock-in.

[![License](https://img.shields.io/badge/license-proprietary-blue)](#license)

---

## Ship in 10 Minutes

### Prerequisites

- Ruby 3.3+ (`ruby -v`)
- Node.js 20+ (`node -v`)
- PostgreSQL 14+ (or Docker)
- Git

### 1. Clone and setup

```bash
git clone https://github.com/arushs/railskit.git my-app
cd my-app
bin/setup
```

The interactive wizard configures your database, auth, payments, email, and AI provider. Every option has a sensible default — press Enter to go fast.

### 2. Add your API keys

```bash
# bin/setup generates .env — open it and fill in your keys
vim .env
```

The wizard tells you exactly which keys you need based on your choices.

### 3. Start the dev server

```bash
bin/dev
```

Runs Rails API (port 3000) + Vite (port 5173) concurrently.

### 4. Open your app

| URL | What |
|-----|------|
| [localhost:5173](http://localhost:5173) | Landing page + frontend |
| [localhost:3000](http://localhost:3000) | Rails API |
| [localhost:5173/api/health](http://localhost:5173/api/health) | Health check (proxied) |

You now have auth, payments, a landing page, and an AI agent — running locally.

### 5. Build your first agent

```bash
cd api
bin/rails generate agent CustomerSupport
```

This scaffolds the agent class, a React chat page, and a test file. Edit the agent, refresh the page — your AI agent is live. See the [First Agent Guide](docs/first-agent.md) for the full walkthrough.

### 6. Deploy

```bash
bin/deploy render   # Managed infrastructure, zero DevOps
bin/deploy fly      # Global edge deployment
bin/deploy docker   # Anywhere with containers
```

**Fly.io:**
```bash
fly launch --copy-config --no-deploy
fly deploy
```

See [Deployment Guide](docs/deployment.md) for detailed instructions.

---

## What You Get

- 🏗️ **Rails 8 API** — Devise auth, Stripe/Lemon Squeezy payments, Solid Queue jobs, email (Resend/Postmark/SMTP)
- ⚛️ **React 19 + Vite 6 frontend** — shadcn/ui, TailwindCSS v4, dark mode, 5 color themes
- 🤖 **Agentic AI core** — RubyLLM integration, agent/tool generators, streaming chat, cost tracking
- 💾 **Pluggable database** — PostgreSQL, Supabase, or Convex via adapter pattern
- 🚀 **One-command setup** — Interactive CLI configures everything
- 📄 **Landing page kit** — Hero, pricing, FAQ, testimonials — ready to customize
- 📊 **Agent dashboard** — Conversations, token costs, tool usage, model breakdown

---

## Architecture Overview

RailsKit is a monorepo with two apps and an AI layer:

```
┌─────────────────────────────────────────────────┐
│              React + Vite (web/)                │
│   TanStack Query │ Zustand │ ActionCable        │
└────────┬─────────────────────────┬──────────────┘
         │ REST/JSON + JWT cookie  │ WebSocket
┌────────▼─────────────────────────▼──────────────┐
│              Rails 8 API (api/)                  │
│   Controllers │ Models │ Agents │ Tools          │
│   Services    │ Jobs   │ Mailers│ Channels       │
├──────────────────────┬──────────────────────────┤
│   Database Adapter   │   LLM Providers          │
│   (PG/Supabase/      │   (OpenAI/Anthropic/     │
│    Convex)           │    Google/Ollama)         │
└──────────────────────┴──────────────────────────┘
```

**Request flow:** React → TanStack Query → Axios → Rails Controller → Service/Model → JSON response

**Agent flow:** React → ActionCable WebSocket → Agent class → LLM provider → Tool execution → Streaming chunks back

**Auth:** Devise + JWT in httpOnly cookies. Immune to XSS — the browser handles tokens automatically.

See [Architecture](docs/architecture.md) for the full deep dive.

---

## Project Structure

```
railskit/
├── api/                          # Rails 8 API-only app
│   ├── app/
│   │   ├── agents/               # RubyLLM agent classes
│   │   ├── tools/                # RubyLLM tool classes (function calling)
│   │   ├── controllers/api/v1/   # Versioned API endpoints
│   │   ├── models/               # ActiveRecord models
│   │   ├── channels/             # ActionCable (streaming)
│   │   ├── jobs/                 # Background jobs (Solid Queue)
│   │   ├── mailers/              # Email templates
│   │   ├── services/             # Business logic + adapters
│   │   └── adapters/             # Database adapters
│   ├── config/
│   │   ├── routes.rb
│   │   └── railskit.yml          # Generated from root config
│   ├── db/                       # Migrations, seeds
│   └── Gemfile
├── web/                          # React + Vite SPA
│   ├── src/
│   │   ├── components/ui/        # shadcn/ui primitives
│   │   ├── components/landing/   # Landing page sections
│   │   ├── components/dashboard/ # Dashboard components
│   │   ├── pages/                # Route pages
│   │   ├── hooks/                # useAuth, useAgent, useProjects...
│   │   ├── lib/api.ts            # Axios client
│   │   ├── lib/config.ts         # Frontend config (from railskit.yml)
│   │   └── stores/               # Zustand (UI state)
│   ├── package.json
│   └── vite.config.ts
├── docs/                         # You're reading it
├── bin/
│   ├── setup                     # Interactive setup wizard
│   ├── dev                       # Start dev server (foreman/overmind)
│   └── deploy                    # Deploy helper
├── railskit.yml                  # Root config (source of truth)
├── Procfile.dev                  # Dev process manager
├── Dockerfile.production         # Multi-stage production build
├── render.yaml                   # Render blueprint
└── fly.toml                      # Fly.io config
```

---

## Config Reference (`railskit.yml`)

`railskit.yml` is the single source of truth. `bin/setup` generates it interactively. Edit it by hand anytime and run `bin/railskit config:generate` to regenerate derived configs.

```yaml
# ─── App ────────────────────────────────────────────
app:
  name: "My App"                    # Emails, titles, meta tags
  domain: "myapp.com"               # Production domain
  tagline: "Ship fast, sleep well"  # Landing page subtitle
  support_email: "help@myapp.com"   # Reply-to address

# ─── Database ───────────────────────────────────────
database:
  adapter: postgresql               # postgresql | supabase | convex

# ─── Auth ───────────────────────────────────────────
auth:
  provider: devise                  # devise | supabase | clerk
  jwt_secret: ${JWT_SECRET}         # Auto-generated by bin/setup
  session_expiry: 7d
  google:
    client_id: ${GOOGLE_CLIENT_ID}
    client_secret: ${GOOGLE_CLIENT_SECRET}
  magic_links:
    enabled: true
    expiry: 15m

# ─── Payments ───────────────────────────────────────
payments:
  provider: stripe                  # stripe | lemon_squeezy
  stripe:
    secret_key: ${STRIPE_SECRET_KEY}
    publishable_key: ${STRIPE_PUBLISHABLE_KEY}
    webhook_secret: ${STRIPE_WEBHOOK_SECRET}
    customer_portal: true
  plans:
    - name: Free
      stripe_price_id: ${STRIPE_FREE_PRICE_ID}
      features: { api_calls: 100, agents: 1, storage_gb: 1 }
    - name: Pro
      stripe_price_id: ${STRIPE_PRO_PRICE_ID}
      price_monthly: 29
      features: { api_calls: 10000, agents: 10, storage_gb: 50 }

# ─── Email ──────────────────────────────────────────
email:
  provider: resend                  # resend | postmark | smtp
  from: "hello@myapp.com"
  resend:
    api_key: ${RESEND_API_KEY}

# ─── AI ─────────────────────────────────────────────
ai:
  default_model: claude-sonnet-4
  providers:
    openai:
      api_key: ${OPENAI_API_KEY}
    anthropic:
      api_key: ${ANTHROPIC_API_KEY}
    google:
      api_key: ${GOOGLE_API_KEY}
  cost_tracking:
    enabled: true
    alert_threshold: 50.00          # Daily spend alert ($)

# ─── Theme ──────────────────────────────────────────
theme:
  preset: default                   # default | ocean | sunset | forest | midnight
  dark_mode: true
  primary_color: "#6366f1"

# ─── SEO ────────────────────────────────────────────
seo:
  title: "My App — Ship fast, sleep well"
  description: "Build your SaaS faster."
  og_image: "/og-image.png"

# ─── Deploy ─────────────────────────────────────────
deploy:
  target: render                    # render | docker | railway
  region: us-east
```

Sensitive values use `${VAR}` syntax and resolve from environment variables. See [Configuration Reference](docs/configuration.md) for every option with detailed explanations.

---

## Documentation

| Guide | Description |
|---|---|
| **[Architecture](docs/architecture.md)** | Monorepo layout, request flow, database adapters, auth flow |
| **[Configuration](docs/configuration.md)** | Every `railskit.yml` option explained |
| **[First Agent](docs/first-agent.md)** | Create an AI agent in 5 minutes |
| **[Agent Development](docs/agents.md)** | Deep dive: agents, tools, streaming, structured output, costs |
| **[Add a Feature](docs/new-feature.md)** | Model → API → React page walkthrough |
| **[Payments](docs/payments.md)** | Stripe integration, plans, webhooks |
| **[Email](docs/email.md)** | Transactional email, templates, providers |
| **[Deployment](docs/deployment.md)** | Render, Fly.io, Docker deployment guides |
| **[Scaling](docs/scaling.md)** | When and how to scale each component |

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Backend** | Rails 8 (API-only) | Battle-tested. Jobs, migrations, mailers — built in. |
| **Frontend** | React 19 + Vite 6 | Fast, massive ecosystem. No Next.js lock-in. |
| **AI** | RubyLLM | Multi-provider (OpenAI, Anthropic, Google, Ollama). Native Rails integration. |
| **UI** | TailwindCSS v4 + shadcn/ui | Accessible, copy-paste ownership. |
| **State** | TanStack Query + Zustand | Server cache + lightweight client state. |
| **Forms** | React Hook Form + Zod | Type-safe validation. |
| **Auth** | Devise + JWT | 15 years of security patches. Or Supabase Auth / Clerk. |
| **Payments** | Stripe | Or Lemon Squeezy. Subscriptions, webhooks, portal. |
| **Email** | Resend | Or Postmark / SMTP. Templates included. |
| **Database** | PostgreSQL / Supabase / Convex | Your choice. Adapters isolate DB code. |
| **Jobs** | Solid Queue | Rails 8 default. No Redis needed. |
| **Realtime** | ActionCable | WebSocket streaming for agent responses. |
| **Deploy** | Render / Fly.io / Docker | One-click or anywhere with containers. |

---

## License

RailsKit is proprietary software. Your purchase grants a single-user license to use, modify, and deploy the code in unlimited projects. You may not redistribute the source code.

See [LICENSE](LICENSE) for full terms.
