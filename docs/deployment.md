# Deployment Guide

RailsKit ships with production-ready deployment configs for **Render**, **Fly.io**, and **Docker**. Pick one and go.

---

## Quick Start

```bash
# See all options
bin/deploy --help

# Deploy to Render (push-based)
bin/deploy render

# Deploy to Fly.io
bin/deploy fly

# Build & run production Docker locally
bin/deploy docker
```

---

## Render (Recommended)

Render gives you managed infrastructure with zero DevOps. The included `render.yaml` blueprint configures everything automatically.

### One-Click Deploy

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/arushs/railskit)

Or manually:

1. Push your code to GitHub
2. [Render Dashboard](https://dashboard.render.com/) → **New** → **Blueprint**
3. Connect your repo — Render reads `render.yaml` and provisions:
   - **Web Service** — Rails API (Docker-based, uses `Dockerfile.production`)
   - **Static Site** — React frontend (built with Vite, served from CDN)
   - **PostgreSQL** — Free-tier database

### Post-Deploy Setup

Set these environment variables in the Render dashboard:

| Variable | Where | Value |
|----------|-------|-------|
| `CORS_ORIGINS` | railskit-api | Your frontend URL (e.g., `https://railskit-web.onrender.com`) |
| `VITE_API_URL` | railskit-web | Your API URL (e.g., `https://railskit-api.onrender.com`) |
| `STRIPE_SECRET_KEY` | railskit-api | Your Stripe live key (if billing enabled) |
| `STRIPE_WEBHOOK_SECRET` | railskit-api | Webhook signing secret |

### Custom Domain

1. Render dashboard → your static site → **Settings** → **Custom Domain**
2. Add your domain and configure DNS (CNAME to `*.onrender.com`)
3. SSL is automatic

---

## Fly.io

Fly.io gives you global edge deployment with auto-scaling.

### First Deploy

```bash
# Install flyctl: https://fly.io/docs/getting-started/installing-flyctl/
bin/deploy fly

# Or with a specific region
bin/deploy fly --region lhr
```

The deploy script handles:
- App creation (if needed)
- PostgreSQL provisioning and attachment
- `SECRET_KEY_BASE` generation
- Rolling deployment

### Configuration

The `fly.toml` at the project root configures:
- Health checks at `/up`
- Auto-stop/start machines (cost savings)
- Rolling deploys with `db:prepare` as release command
- Memory: 512MB shared CPU

### Set Environment Variables

```bash
flyctl secrets set \
  CORS_ORIGINS="https://your-frontend.com" \
  STRIPE_SECRET_KEY="sk_live_..." \
  --app railskit
```

### Fly + Static Frontend

For the React frontend, either:
1. Serve from Rails (already built into `Dockerfile.production` at `/public/web/`)
2. Deploy separately to Cloudflare Pages / Vercel / Netlify

---

## Docker (Universal)

Works anywhere: AWS, DigitalOcean, bare metal, local testing.

### Build & Run Locally

```bash
# Full production stack (PostgreSQL + Rails)
bin/deploy docker

# Build image only
bin/deploy docker --build-only

# Custom tag
bin/deploy docker --tag myregistry/railskit:v1.0
```

### Multi-Stage Build

`Dockerfile.production` uses a multi-stage build:

1. **Stage 1 (frontend-build):** Node 22 — installs deps, builds React with Vite
2. **Stage 2 (production):** Ruby 3.3-slim — installs gems, copies built frontend into `public/web/`, runs Rails with Thruster

Features:
- jemalloc for better memory management
- Non-root user for security
- Bootsnap precompilation for fast boot
- `db:prepare` on entrypoint (creates or migrates)
- ~250MB final image

### Push to Registry

```bash
bin/deploy docker --build-only --tag ghcr.io/arushs/railskit:latest
docker push ghcr.io/arushs/railskit:latest
```

---

## Environment Variables

See `.env.production.example` for the full list. Key variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `SECRET_KEY_BASE` | ✅ | Generate with `bin/rails secret` |
| `RAILS_ENV` | ✅ | Must be `production` |
| `CORS_ORIGINS` | ✅ | Frontend URL(s), comma-separated |
| `VITE_API_URL` | ✅ | API URL (build-time for frontend) |
| `REDIS_URL` | ❌ | Only if using Redis (Solid adapters don't need it) |
| `STRIPE_SECRET_KEY` | ❌ | If billing is enabled |
| `SOLID_QUEUE_IN_PUMA` | ❌ | Set to `true` for single-server deploys |

---

## Health Checks

All deployment configs use the built-in Rails health check:

- **Endpoint:** `GET /up`
- **Success:** 200 if the app boots cleanly
- **Failure:** 500 if any exception during boot

The API also exposes `GET /api/health` for application-level checks.

---

## Production Checklist

### Security
- [ ] `SECRET_KEY_BASE` is set (unique, random)
- [ ] CORS restricted to your frontend domain only
- [ ] `force_ssl` enabled in `config/environments/production.rb`
- [ ] All API keys in env vars, never committed

### Stripe (if billing enabled)
- [ ] Switched from `sk_test_` to `sk_live_` keys
- [ ] Webhook endpoint registered with production URL
- [ ] Webhook signing secret updated

### DNS & SSL
- [ ] A/CNAME records pointing to host
- [ ] SSL certificate active (auto on Render/Fly)
- [ ] `www` redirect configured

### Monitoring
- [ ] Error tracking (Sentry, Honeybadger)
- [ ] Uptime monitoring on `/up` endpoint
- [ ] Log aggregation configured
