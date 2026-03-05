<p align="center">
  <!-- Replace with actual logo -->
  <img src="docs/assets/logo-placeholder.png" alt="RailsKit" width="80" />
</p>

<h1 align="center">RailsKit</h1>
<p align="center"><strong>Ship agentic AI apps in a weekend.</strong></p>

<p align="center">
  <a href="https://www.ruby-lang.org/"><img src="https://img.shields.io/badge/Ruby-3.3%2B-CC342D?logo=ruby" alt="Ruby"></a>
  <a href="https://rubyonrails.org/"><img src="https://img.shields.io/badge/Rails-8.1-D30001?logo=rubyonrails" alt="Rails"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue" alt="License"></a>
  <a href="https://github.com/arushs/railskit/stargazers"><img src="https://img.shields.io/github/stars/arushs/railskit?style=flat" alt="Stars"></a>
</p>

<p align="center">
  The fastest way to build AI-powered products.<br>
  Rails 8 API + React 19 + RubyLLM. Auth, payments, agents, streaming — all wired up.
</p>

---

## ⚡ Quick Start

```bash
git clone https://github.com/arushs/railskit.git myapp
cd myapp
bin/setup          # Interactive wizard configures everything
bin/dev            # Start development servers
# Open http://localhost:5173 → your app is running
```

---

## 📦 What's Inside

| Feature | Details |
|---------|---------|
| 🤖 **AI Agents** | RubyLLM, `rails generate agent`, tool system, streaming responses, cost tracking |
| 🔐 **Auth** | Devise + JWT (httpOnly cookies) + Google OAuth + Magic Links |
| 💳 **Payments** | Stripe or Lemon Squeezy — subscriptions, webhooks, customer portal |
| ⚛️ **React 19 SPA** | Vite 6, TanStack Query, Zustand, shadcn/ui, 5 color themes, dark mode |
| 📄 **Landing Page** | Hero, pricing, FAQ, testimonials — ready to customize |
| 📊 **Agent Dashboard** | Conversations, token costs, tool usage, model breakdown |
| 📧 **Email** | Resend, Postmark, or SMTP — templates included |
| 💾 **Database** | PostgreSQL, Supabase, or Convex via adapter pattern |
| 🚀 **Deploy** | Render, Fly.io, Docker — one-command deployment |
| ⚙️ **Config** | Single `railskit.yml` drives everything — one file, zero guessing |

---

## 🤖 Build an Agent in 60 Seconds

Generate the agent and a tool:

```bash
cd api
bin/rails generate agent CustomerSupport
bin/rails generate tool LookupOrder
```

This scaffolds the agent class, a React chat component, and a test file. Here's what the agent looks like:

```ruby
class CustomerSupportAgent
  SYSTEM_PROMPT = <<~PROMPT
    You are a helpful support agent. Use your tools
    to look up orders and resolve customer issues.
  PROMPT

  def initialize(conversation: nil, model: nil)
    @llm_chat = RubyLLM.chat(model: model)
    @llm_chat.with_instructions(SYSTEM_PROMPT)
    @llm_chat.with_tool(LookupOrderTool)
  end

  def stream(message, &block)
    @llm_chat.ask(message, &block)
  end
end
```

Edit the class, refresh the page — your agent is live. See **[Build Your First Agent](docs/build-your-first-agent.md)** for the full walkthrough.

---

## 🏗️ Architecture

```
React 19 + Vite          Rails 8 API            LLM Providers
┌──────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  TanStack     │◄──►│  Controllers     │    │  OpenAI          │
│  Query        │REST│  Services        │    │  Anthropic       │
│  Zustand      │JWT │  Models          │    │  Google          │
│  shadcn/ui    │    │                  │    │  Ollama (local)  │
│               │◄══►│  Agents + Tools  │◄──►│                  │
│               │ WS │  ActionCable     │    │                  │
└──────────────┘    └───────┬──────────┘    └──────────────────┘
                            │
                    ┌───────▼──────────┐
                    │  PostgreSQL       │
                    │  Solid Queue      │
                    │  (or Supabase/    │
                    │   Convex)         │
                    └──────────────────┘
```

**REST + JWT** for standard API calls. **ActionCable WebSocket** for real-time agent streaming. One monorepo, clean separation.

---

## 📚 Documentation

| Guide | What You'll Learn |
|-------|-------------------|
| [Ship in 10 Minutes](docs/first-agent.md) | Zero to running app |
| [Build Your First Agent](docs/build-your-first-agent.md) | Create an AI agent, add tools, stream responses |
| [Agent Development](docs/agents.md) | Deep dive — tools, structured output, cost tracking |
| [Architecture](docs/architecture.md) | Monorepo layout, request flow, auth, database adapters |
| [Configuration](docs/configuration.md) | Every `railskit.yml` option explained |
| [Add a Feature](docs/new-feature.md) | Model → API → React page walkthrough |
| [Payments](docs/payments.md) | Stripe integration, plans, webhooks |
| [Email](docs/email.md) | Transactional email, templates, providers |
| [Deployment](docs/deployment.md) | Render, Fly.io, Docker deployment guides |
| [Scaling](docs/scaling.md) | When and how to scale each component |

---

## 🧱 Stack

| | |
|---|---|
| **Backend** | Ruby 3.3+, Rails 8.1 (API-only), Solid Queue |
| **Frontend** | React 19, Vite 6, TailwindCSS v4, shadcn/ui |
| **AI** | RubyLLM — OpenAI, Anthropic, Google, Ollama |
| **State** | TanStack Query + Zustand |
| **Auth** | Devise + JWT · Google OAuth · Magic Links |
| **Payments** | Stripe · Lemon Squeezy |
| **Realtime** | ActionCable (WebSocket) |
| **Database** | PostgreSQL · Supabase · Convex |
| **Deploy** | Render · Fly.io · Docker |

---

## 📄 License

MIT. See [LICENSE](LICENSE) for details.
