---
title: Getting Started with RailsKit
description: A quick guide to setting up RailsKit and shipping your first AI-powered Rails app.
date: "2026-03-04"
author: RailsKit Team
category: guides
tags:
  - guide
  - quickstart
  - setup
image: /images/blog/getting-started.jpg
---

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

- A Rails 8 API backend with authentication, billing, and real-time WebSockets
- A React 19 frontend with TailwindCSS, dark mode, and SEO
- AI agent infrastructure with tool use and streaming
- Deployment configs for Fly.io, Render, and Docker

## Project Structure

```
railskit/
├── api/           # Rails 8 API backend
├── web/           # React 19 frontend
├── railskit.yml   # Unified configuration
└── bin/           # Setup & dev scripts
```

## What's Included

### Authentication
Email/password, OAuth (Google, GitHub), magic links, and JWT sessions — all pre-wired with Devise.

### Billing
Stripe integration with plans, subscriptions, and a customer portal. Swap in LemonSqueezy with one config change.

### AI Agents
RubyLLM-powered agents with tool use, streaming responses, and multi-agent orchestration.

### Deployment
One-command deploys to Fly.io or Render. Docker and Kamal configs included.

## Next Steps

1. Customize `railskit.yml` with your app name, API keys, and preferences
2. Run `bin/dev` to start the development server
3. Visit `http://localhost:5173` to see your app
4. Read the [architecture guide](/blog/why-rails-for-ai) for a deeper understanding
