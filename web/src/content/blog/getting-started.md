# Getting Started with RailsKit

Welcome to RailsKit — the fastest way to ship AI-powered Rails applications.

## Prerequisites

- Ruby 3.3+
- Node.js 22+
- PostgreSQL 16+

## Quick Start

```bash
git clone https://github.com/arushs/railskit.git my-app
cd my-app
bin/setup
bin/dev
```

That's it. You now have:

- **Rails API** running on `localhost:3000`
- **React frontend** on `localhost:5173`
- **Authentication** (Devise + JWT + OAuth)
- **Billing** (Stripe subscriptions)
- **AI Agents** (RubyLLM + ActionCable streaming)

## Your First Agent

```bash
rails generate agent helpdesk --tools search,knowledge_base
```

This creates:

- `app/agents/helpdesk_agent.rb` — agent logic
- `app/tools/search_tool.rb` — search tool
- `app/tools/knowledge_base_tool.rb` — KB tool

Wire it to a chat and you've got a working AI helpdesk in under 5 minutes.

## Next Steps

- [Configuration Guide](/blog/configuration) — customize `railskit.yml`
- [Deployment](/blog/deployment) — deploy to Render or Fly.io
- [Building Agents](/blog/agents) — deep dive into the agent system
