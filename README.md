# RailsKit

**Ship your AI-powered SaaS in a weekend.** Rails 8 API + React 19 + Vite + RubyLLM. No framework lock-in.

[![License](https://img.shields.io/badge/license-proprietary-blue)](#license)

---

## What You Get

- 🏗️ **Rails 8 API** — Devise + JWT auth (email/password, Google OAuth, magic links), Stripe billing, Solid Queue jobs, transactional email
- ⚛️ **React 19 + Vite frontend** — shadcn/ui components, TailwindCSS v4, dark mode, landing page kit, auth flows
- 🤖 **AI agent framework** — RubyLLM integration, agent/tool generators, real-time streaming via ActionCable, conversation persistence
- 💾 **Pluggable adapters** — Database (PostgreSQL/Supabase/Convex), auth (Devise/Supabase/Clerk), email (Resend/Postmark/SMTP), payments (Stripe/Lemon Squeezy)
- 🚀 **Interactive setup** — CLI wizard configures everything: database, auth, payments, email, AI provider, theme
- 📄 **Landing page kit** — Hero, pricing, FAQ, testimonials, features — ready to customize
- 📊 **Agent dashboard** — Conversations, token cost tracking, tool usage analytics

---

## Ship in 10 Minutes

### Prerequisites

- Ruby 3.3+ (`ruby -v`)
- Node.js 20+ (`node -v`)
- PostgreSQL 14+ (or Docker)
- Git

### 1. Clone & enter

```bash
git clone https://github.com/arushs/railskit.git my-app
cd my-app
```

### 2. Run the interactive setup wizard

```bash
bin/setup
```

The wizard walks you through every decision with interactive prompts:

```
📦 App Configuration
  App name: my-ai-app
  Domain: localhost

🗄️  Database
  ❯ PostgreSQL (local/managed)
    Supabase (hosted Postgres)
    Convex (real-time backend)

🔐 Authentication
  ❯ Devise (Rails-native)
    Supabase Auth
    Clerk
  Enable Google OAuth? Yes
  Enable magic link sign-in? Yes

💳 Payments
  ❯ Stripe
    Lemon Squeezy

📧 Email
  ❯ Resend
    Postmark
    SMTP

🤖 AI Provider
  ❯ OpenAI    → gpt-4o, gpt-4o-mini, gpt-4-turbo, o1, o1-mini
    Anthropic → claude-sonnet-4-20250514, claude-3-5-haiku, claude-opus-4-20250514
    Google    → gemini-2.0-flash, gemini-2.0-pro, gemini-1.5-pro
    Ollama    → llama3.2, mistral, codellama, deepseek-coder

🎨 Theme
  Primary color: Indigo (#6366f1)
  Dark mode: Yes
```

The wizard:
- Writes `railskit.yml` (your config source of truth)
- Generates `.env` with your chosen provider credentials
- Runs `bundle install` (API) and `npm install` (web)
- Creates and migrates the database (if PostgreSQL)

Every option has a sensible default — press Enter to go fast.

### 3. Review your API keys

```bash
# Open .env and fill in any keys you left blank
# (Stripe, OpenAI, Google OAuth, etc.)
```

### 4. Start development

```bash
bin/dev
```

This runs the Rails API (port 3000) and Vite dev server (port 5173) via Procfile.dev.

### 5. Open your app

- **Landing page:** [http://localhost:5173](http://localhost:5173)
- **API health check:** [http://localhost:3000/api/health](http://localhost:3000/api/health)
- **Sign up:** [http://localhost:5173/signup](http://localhost:5173/signup)

You now have a working SaaS with auth, payments, a landing page, and an AI help desk agent — running locally.

### 6. Build your first agent

```bash
cd api
bin/rails generate agent CustomerSupport
```

This creates three files:
- `api/app/agents/customer_support_agent.rb` — agent class with system prompt
- `web/src/components/agents/CustomerSupportChat.tsx` — React chat UI
- `api/test/agents/customer_support_agent_test.rb` — test file

Edit the agent, add tools, and hit the streaming endpoint. See [Build Your First Agent](docs/first-agent.md).

### 7. Deploy

**Render (recommended):**
Connect your GitHub repo on Render → New Blueprint Instance. `render.yaml` handles everything.

**Docker:**
```bash
docker compose up
```

**Fly.io:**
```bash
fly launch --copy-config --no-deploy
fly deploy
```

See [Deployment Guide](docs/deployment.md) for detailed instructions.

---

## Project Structure

```
railskit/
├── api/                          # Rails 8 API-only app
│   ├── app/
│   │   ├── adapters/             # Database adapters (PostgreSQL, Supabase, Convex)
│   │   ├── agents/               # AI agent classes (RubyLLM)
│   │   │   └── concerns/         # StructuredOutput mixin
│   │   ├── channels/             # ActionCable channels (streaming)
│   │   ├── controllers/
│   │   │   └── api/
│   │   │       ├── auth/         # Sessions, registrations, magic links, OAuth, me
│   │   │       ├── webhooks/     # Stripe webhook handler
│   │   │       ├── agents_controller.rb
│   │   │       ├── checkout_controller.rb
│   │   │       ├── billing_portal_controller.rb
│   │   │       ├── health_controller.rb
│   │   │       └── plans_controller.rb
│   │   ├── jobs/                 # AgentStreamJob (Solid Queue)
│   │   ├── mailers/              # MagicLink, Transactional, User mailers
│   │   ├── models/               # User, Chat, Message, Plan, Subscription
│   │   ├── schemas/              # RubyLLM structured output schemas
│   │   ├── services/             # EmailProvider, PaymentProvider adapters
│   │   └── tools/                # RubyLLM tool classes
│   ├── config/
│   │   ├── initializers/         # railskit.rb, ruby_llm.rb, stripe.rb, etc.
│   │   └── routes.rb
│   ├── db/
│   │   ├── migrate/              # Users, chats, messages, plans, subscriptions
│   │   └── seeds/                # Plan seed data
│   └── lib/
│       ├── auth_providers/       # Devise JWT, Supabase, Clerk stubs
│       └── generators/           # agent, tool, migration generators
├── web/                          # React 19 + Vite + TailwindCSS v4
│   └── src/
│       ├── components/
│       │   ├── agents/           # HelpDeskChat (generated agent UIs go here)
│       │   ├── dashboard/        # DashboardLayout, Sidebar, AgentDashboard
│       │   ├── landing/          # Hero, Features, Pricing, FAQ, CTA, etc.
│       │   └── ui/               # shadcn/ui components
│       ├── contexts/             # AuthContext, ThemeContext
│       ├── hooks/                # useAuth, useAgentStream
│       ├── lib/                  # API client, agents-api, utils
│       └── pages/                # Landing, Login, Signup, Dashboard, Billing, Settings
├── docs/                         # Documentation (you're here)
├── bin/
│   ├── setup                     # Interactive setup wizard (Ruby + TTY::Prompt)
│   ├── dev                       # Start dev servers
│   └── deploy                    # Deploy helper
├── docker-compose.yml            # Dev containers (Postgres, Redis, API, web)
├── Dockerfile.production         # Production Docker build
├── Procfile.dev                  # api + web processes
├── railskit.yml                  # Root config (source of truth)
├── render.yaml                   # Render Blueprint deploy config
└── fly.toml                      # Fly.io deploy config
```

---

## Documentation

| Guide | Description |
|---|---|
| [Architecture Overview](docs/architecture.md) | How the API, frontend, and AI layer communicate |
| [Configuration Reference](docs/configuration.md) | Every `railskit.yml` option explained |
| [Build Your First Agent](docs/first-agent.md) | Create an AI agent in 5 minutes |
| [Agent Development Guide](docs/agents.md) | Deep dive: agents, tools, streaming, structured output |
| [Add a New Feature](docs/new-feature.md) | Add a model, API endpoint, and React page |
| [Payments](docs/payments.md) | Stripe setup, plans, webhooks, billing portal |
| [Email System](docs/email.md) | Email providers, templates, inbound email |
| [Deployment Guide](docs/deployment.md) | Render, Docker, Fly.io, Kamal |
| [Scaling Guide](docs/scaling.md) | When and how to scale beyond defaults |

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Backend** | Rails 8.1 (API-only) | Migrations, jobs, mailers, ActionCable — all built in |
| **Frontend** | React 19 + Vite 7 | Fast, modern, no Next.js lock-in |
| **AI** | RubyLLM | Multi-provider (OpenAI, Anthropic, Google, Ollama). Native tools + streaming |
| **Styling** | TailwindCSS v4 + shadcn/ui | Copy-paste component ownership. Accessible |
| **Auth** | Devise + JWT (default) | Email/password, Google OAuth, magic links. Or swap in Supabase/Clerk |
| **Payments** | Stripe (default) | Checkout, subscriptions, customer portal, webhooks |
| **Email** | Resend (default) | Or Postmark / SMTP. Transactional templates included |
| **Database** | PostgreSQL (default) | Supabase and Convex adapters available |
| **Jobs** | Solid Queue | Rails 8 default. Runs inside Puma — no Redis needed |
| **Realtime** | ActionCable + Solid Cable | WebSocket streaming for agent responses |
| **Deploy** | Render / Docker / Fly.io / Kamal | Blueprint configs included |

---

## License

RailsKit is proprietary software. Your purchase grants a single-user license to use, modify, and deploy the code in unlimited projects. You may not redistribute the source code.

See [LICENSE](LICENSE) for full terms.
