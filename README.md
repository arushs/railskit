# RailsKit

**Ship your AI-powered SaaS in a weekend.** Rails API + React + Vite + RubyLLM. No framework lock-in.

[![License](https://img.shields.io/badge/license-proprietary-blue)](#license)

---

## What You Get

- 🏗️ **Rails 8 API** — Devise auth, Stripe/Lemon Squeezy payments, background jobs, email
- ⚛️ **React + Vite frontend** — shadcn/ui, TailwindCSS v4, dark mode, 5 color themes
- 🤖 **Agentic AI core** — RubyLLM integration, agent/tool generators, streaming chat, cost tracking
- 💾 **Pluggable database** — Convex (recommended), Supabase, or PostgreSQL
- 🚀 **One-command setup** — Interactive CLI configures everything: DB, auth, payments, email, AI, DNS
- 📄 **Landing page kit** — Hero, pricing, FAQ, testimonials — ready to customize
- 📊 **Agent dashboard** — Conversations, token costs, tool usage, model breakdown

---

## Ship in 10 Minutes

### Prerequisites

- Ruby 3.3+ (`ruby -v`)
- Node.js 20+ (`node -v`)
- Git

### 1. Clone the repo

```bash
git clone https://github.com/arushs/railskit.git my-app
cd my-app
```

### 2. Run the interactive setup

```bash
bin/setup
```

The setup wizard walks you through every decision:

```
🚀 Welcome to RailsKit — Let's build something.

📦 App name: my-ai-app

💾 Database:
  ❯ Convex (real-time, zero-config, recommended for speed)
    Supabase (Postgres + auth + realtime, hosted)
    PostgreSQL (self-managed, maximum control)

🔐 Authentication:
  ❯ Devise + JWT (battle-tested, full control)
    Supabase Auth (if using Supabase DB)
    Clerk (hosted, drops in fast)

💳 Payments:
  ❯ Stripe (default, most flexibility)
    Lemon Squeezy (simpler, handles tax)

📧 Email:
  ❯ Resend (best DX)
    Postmark (deliverability-focused)
    SMTP (bring your own)

🤖 AI Provider:
  ❯ OpenAI (GPT-4o, most popular)
    Anthropic (Claude, best for agents)
    Google (Gemini)
    Multiple (configure later in railskit.yml)
```

Every option has a sensible default — press Enter to go fast.

### 3. Add your API keys

```bash
cp .env.example .env
```

Open `.env` and fill in the keys for your chosen providers. The setup wizard tells you exactly which ones you need.

### 4. Start the dev server

```bash
bin/dev
```

This runs Rails API + Vite concurrently via foreman.

### 5. Open your app

- **Landing page:** [http://localhost:5173](http://localhost:5173)
- **API:** [http://localhost:3000](http://localhost:3000)
- **Health check:** [http://localhost:5173/api/health](http://localhost:5173/api/health) (proxied)

You now have a working SaaS app with auth, payments, a landing page, and an AI agent — running locally.

### 6. Build your first agent

```bash
cd api
bin/rails generate agent CustomerSupport
```

This scaffolds:
- `api/app/agents/customer_support_agent.rb` — agent class with instructions
- `api/app/tools/` — directory for your tools
- `web/src/pages/agents/CustomerSupport.tsx` — React chat UI
- `api/test/agents/customer_support_agent_test.rb` — test file

Edit the agent, create tools, refresh the page. Your AI agent is live.

### 7. Deploy

**Render (recommended — one click):**

```bash
# Push to GitHub, then connect your repo on Render
# render.yaml handles everything: API, web, database, workers
```

**Docker (anywhere):**

```bash
docker compose up
```

See the [Deployment Guide](docs/deployment.md) for detailed instructions.

---

## Project Structure

```
railskit/
├── api/                      # Rails 8 API-only app
│   ├── app/
│   │   ├── agents/           # RubyLLM agent classes
│   │   ├── tools/            # RubyLLM tool classes
│   │   ├── controllers/      # API controllers
│   │   ├── models/           # ActiveRecord models
│   │   ├── channels/         # ActionCable (streaming)
│   │   ├── jobs/             # Background jobs (Solid Queue)
│   │   ├── mailers/          # Email templates
│   │   └── services/         # Business logic
│   ├── config/
│   │   └── railskit.yml      # Auto-generated config
│   ├── db/                   # Migrations + seeds
│   └── Gemfile
├── web/                      # React + Vite app
│   ├── src/
│   │   ├── components/       # UI components (shadcn/ui)
│   │   ├── pages/            # Route pages
│   │   ├── hooks/            # Custom hooks (useAuth, useAgent)
│   │   ├── lib/              # API client, utils
│   │   └── stores/           # Zustand state
│   ├── package.json
│   └── vite.config.ts
├── docs/                     # Documentation
├── bin/
│   ├── setup                 # Interactive setup wizard
│   └── dev                   # Start dev server
├── docker-compose.yml        # Dev + production containers
├── Procfile.dev              # Process manager config
└── railskit.yml              # Root config (source of truth)
```

---

## Documentation

| Guide | Description |
|---|---|
| [Architecture Overview](docs/architecture.md) | How the API, frontend, and AI layer communicate |
| [Configuration Reference](docs/configuration.md) | Every `railskit.yml` option explained |
| [Build Your First Agent](docs/first-agent.md) | Create an AI agent in 5 minutes |
| [Add a New Feature](docs/new-feature.md) | Add a model, API endpoint, and React page |
| [Agent Development Guide](docs/agents.md) | Deep dive: agents, tools, streaming, costs |
| [Deployment Guide](docs/deployment.md) | Render, Docker, Railway, Fly.io |
| [Scaling Guide](docs/scaling.md) | When and how to scale beyond defaults |

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Backend** | Rails 8 (API-only) | 20 years of battle-tested reliability. Background jobs, migrations, mailers — all built in. |
| **Frontend** | React 19 + Vite 6 | Modern, fast, massive component ecosystem. No Next.js lock-in. |
| **AI** | RubyLLM | Multi-provider (OpenAI, Anthropic, Google, Ollama, 800+ models). Native Rails integration. |
| **Styling** | TailwindCSS v4 + shadcn/ui | Copy-paste component ownership. Accessible. Customizable. |
| **State** | TanStack Query + Zustand | Server state caching + lightweight client state. No Redux. |
| **Forms** | React Hook Form + Zod | Type-safe validation with minimal boilerplate. |
| **Auth** | Devise + JWT (default) | 15 years of security patches. Or swap in Supabase Auth / Clerk. |
| **Payments** | Stripe (default) | Or Lemon Squeezy. Webhooks, subscriptions, customer portal. |
| **Email** | Resend (default) | Or Postmark / SMTP. Transactional emails with templates. |
| **Database** | Convex / Supabase / PostgreSQL | Your choice. Adapters isolate DB-specific code. |
| **Jobs** | Solid Queue | Rails 8 default. No Redis needed for basics. |
| **Realtime** | ActionCable | WebSocket streaming for agent responses. |
| **Deploy** | Render / Docker | One-click or anywhere with containers. |

---

## License

RailsKit is proprietary software. Your purchase grants a single-user license to use, modify, and deploy the code in unlimited projects. You may not redistribute the source code.

See [LICENSE](LICENSE) for full terms.
