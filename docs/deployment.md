# Deployment Guide

RailsKit ships with production-ready configs for **Render**, **Fly.io**, and **Docker**. Pick one and go.

---

## Quick Reference

```bash
bin/deploy render       # Managed infrastructure, zero DevOps
bin/deploy fly          # Global edge deployment
bin/deploy docker       # Build containers, run anywhere
bin/deploy --help       # See all options
```

---

## Option 4: Kamal

Managed infrastructure with zero DevOps. The included `render.yaml` blueprint provisions everything automatically.

### One-Click Deploy

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/arushs/railskit)

### Manual Setup

1. Push your code to GitHub
2. [Render Dashboard](https://dashboard.render.com/) → **New** → **Blueprint**
3. Connect your repo — Render reads `render.yaml` and creates:

| Service | Type | Description |
|---|---|---|
| `railskit-api` | Web Service (Docker) | Rails API using `Dockerfile.production` |
| `railskit-web` | Static Site | React built with Vite, served from CDN |
| `railskit-db` | PostgreSQL | Free-tier database |

### What `render.yaml` Configures

```yaml
# Key settings (already configured for you):
services:
  - type: web
    name: railskit-api
    runtime: docker
    dockerfilePath: ./Dockerfile.production
    healthCheckPath: /up
    envVars:
      - key: SOLID_QUEUE_IN_PUMA    # Jobs run inside web process
        value: "true"
      - key: DATABASE_URL           # Auto-linked to provisioned DB
        fromDatabase: { name: railskit-db, property: connectionString }
      - key: SECRET_KEY_BASE
        generateValue: true          # Render generates this

  - type: web
    name: railskit-web
    runtime: static
    buildCommand: cd web && npm ci && npm run build
    staticPublishPath: ./web/dist
    routes:
      - type: rewrite              # SPA routing — all paths → index.html
        source: /*
        destination: /index.html
```

### Post-Deploy: Set Environment Variables

In the Render dashboard, set these for `railskit-api`:

```bash
CORS_ORIGINS=https://railskit-web.onrender.com    # Your frontend URL
```

And for `railskit-web`:

```bash
VITE_API_URL=https://railskit-api.onrender.com     # Your API URL
```

Then add your app-specific keys (Stripe, AI provider, etc.) to `railskit-api`.

### Custom Domain

1. Render dashboard → your static site → **Settings** → **Custom Domain**
2. Add your domain, configure DNS (CNAME to `*.onrender.com`)
3. SSL is automatic

### Render Tips

- **PR previews** are enabled for the static site — every PR gets a preview URL
- **Zero-downtime deploys** — Render waits for health check before switching traffic
- **Auto-deploy** — pushes to your default branch trigger deploys automatically
- **Costs:** Free tier works for launch. Upgrade API to Starter ($7/mo) for better cold-start times

---

## Fly.io

Global edge deployment with auto-scaling. Your app runs close to your users.

### First Deploy

```bash
# Install flyctl: https://fly.io/docs/getting-started/installing-flyctl/
fly auth login

# Deploy (creates app + database if needed)
bin/deploy fly

# Or specify a region
bin/deploy fly --region lhr    # London
bin/deploy fly --region nrt    # Tokyo
```

The deploy script handles app creation, PostgreSQL provisioning, `SECRET_KEY_BASE` generation, and rolling deployment.

### What `fly.toml` Configures

```toml
app = "railskit"
primary_region = "iad"          # US East (change to your preference)

[build]
  dockerfile = "Dockerfile.production"

[env]
  SOLID_QUEUE_IN_PUMA = "true"  # Jobs inside web process
  WEB_CONCURRENCY = "2"         # Puma workers

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = "suspend"  # Cost savings — suspends idle machines
  auto_start_machines = true      # Wakes on request
  min_machines_running = 1

[deploy]
  release_command = "bin/rails db:prepare"  # Runs migrations on deploy
  strategy = "rolling"

[[vm]]
  size = "shared-cpu-1x"
  memory = "512mb"
```

### Set Secrets

```bash
flyctl secrets set \
  CORS_ORIGINS="https://your-frontend.com" \
  STRIPE_SECRET_KEY="sk_live_..." \
  OPENAI_API_KEY="sk-..." \
  --app railskit
```

### Frontend Options with Fly

The `Dockerfile.production` builds React into `public/web/` — so the Rails app serves the frontend too. Single deployment, single domain.

Or deploy the frontend separately:

| Platform | Command | Best for |
|---|---|---|
| Cloudflare Pages | `cd web && npx wrangler pages deploy dist` | Global CDN, free |
| Vercel | `cd web && vercel --prod` | Fast, preview deploys |
| Netlify | `cd web && netlify deploy --prod` | Simple, forms |

### Fly Tips

- **Scale to multiple regions:** `fly scale count 2 --region iad,lhr`
- **View logs:** `fly logs --app railskit`
- **SSH in:** `fly ssh console --app railskit`
- **Costs:** ~$3-5/mo for a single shared-cpu machine with auto-suspend

---

## Docker (Universal)

Works anywhere: AWS ECS, DigitalOcean App Platform, Google Cloud Run, bare metal, local testing.

### Build & Run Locally

```bash
# Full production stack
bin/deploy docker

# Build image only
bin/deploy docker --build-only

# Custom tag for your registry
bin/deploy docker --tag ghcr.io/yourname/myapp:v1.0
```

### Multi-Stage Build Details

`Dockerfile.production` builds everything in two stages:

```dockerfile
# Stage 1: Build React frontend (Node 22)
FROM node:22-slim AS frontend-build
WORKDIR /app/web
COPY web/package.json web/package-lock.json ./
RUN npm ci --production=false
COPY web/ ./
ARG VITE_API_URL=""
RUN npm run build

# Stage 2: Production Rails (Ruby 3.3-slim)
FROM ruby:3.3-slim AS production
# ... installs gems, copies built frontend to public/web/
# ... runs Rails with Thruster
```

Key features:
- **jemalloc** — better memory management for Ruby
- **Non-root user** — security best practice
- **Bootsnap precompilation** — fast cold boot
- **`db:prepare` on entrypoint** — auto-creates or migrates database
- **~250MB final image** — slim base, no dev dependencies

### Push to Registry

```bash
# GitHub Container Registry
bin/deploy docker --build-only --tag ghcr.io/arushs/railskit:latest
docker push ghcr.io/arushs/railskit:latest

# Docker Hub
docker tag railskit:latest yourname/railskit:latest
docker push yourname/railskit:latest
```

### Run on Any Host

```bash
docker run -d \
  --name railskit \
  -p 3000:3000 \
  -e DATABASE_URL="postgres://user:pass@db:5432/railskit" \
  -e SECRET_KEY_BASE="$(openssl rand -hex 64)" \
  -e RAILS_ENV=production \
  -e CORS_ORIGINS="https://your-frontend.com" \
  ghcr.io/arushs/railskit:latest
```

### Docker Compose (for self-hosted)

```yaml
# docker-compose.production.yml
version: "3.8"
services:
  db:
    image: postgres:16
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: railskit_production
      POSTGRES_USER: railskit
      POSTGRES_PASSWORD: ${DB_PASSWORD}

  app:
    image: ghcr.io/arushs/railskit:latest
    ports:
      - "3000:3000"
    depends_on:
      - db
    environment:
      DATABASE_URL: postgres://railskit:${DB_PASSWORD}@db:5432/railskit_production
      SECRET_KEY_BASE: ${SECRET_KEY_BASE}
      RAILS_ENV: production
      CORS_ORIGINS: https://your-domain.com
      SOLID_QUEUE_IN_PUMA: "true"
      # Add your app keys here

volumes:
  pgdata:
```

```bash
# Generate secrets
echo "DB_PASSWORD=$(openssl rand -hex 32)" >> .env.production
echo "SECRET_KEY_BASE=$(openssl rand -hex 64)" >> .env.production

# Deploy
docker compose -f docker-compose.production.yml --env-file .env.production up -d
```

---

## Environment Variables Reference

All deployment targets need these. See `.env.production.example` for the full list.

### Required (all deployments)

| Variable | Description | How to get |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | Your DB host |
| `SECRET_KEY_BASE` | Rails secret (64+ hex chars) | `bin/rails secret` |
| `RAILS_ENV` | Must be `production` | — |
| `CORS_ORIGINS` | Frontend URL(s), comma-separated | Your domain |

### Required (build-time, for frontend)

| Variable | Description |
|---|---|
| `VITE_API_URL` | Your API URL (baked into the React build) |

### Optional (depends on your config)

| Variable | When needed |
|---|---|
| `STRIPE_SECRET_KEY` | Payments enabled |
| `STRIPE_WEBHOOK_SECRET` | Payments enabled |
| `OPENAI_API_KEY` | OpenAI models |
| `ANTHROPIC_API_KEY` | Anthropic models |
| `RESEND_API_KEY` | Resend email |
| `REDIS_URL` | Only if using Redis (Solid adapters don't need it) |
| `SOLID_QUEUE_IN_PUMA` | Set `true` for single-server deploys |

---

## Health Checks

All deployment configs use the built-in Rails health check:

| Endpoint | Purpose | Returns |
|---|---|---|
| `GET /up` | Boot health | 200 if app boots, 500 on exception |
| `GET /api/health` | Application health | 200 with JSON status |

Configure your monitoring tool to poll `/up` every 30-60 seconds.

---

## Production Checklist

### Security
- [ ] `SECRET_KEY_BASE` set (unique, random, 64+ hex characters)
- [ ] `CORS_ORIGINS` restricted to your frontend domain only
- [ ] `force_ssl` enabled in `config/environments/production.rb` (default: yes)
- [ ] All API keys in env vars, never committed to git

### Stripe (if billing enabled)
- [ ] Switched from `sk_test_` to `sk_live_` keys
- [ ] Webhook endpoint registered: `https://your-api.com/api/webhooks/stripe`
- [ ] Webhook signing secret (`STRIPE_WEBHOOK_SECRET`) updated for production

### DNS & SSL
- [ ] A/CNAME records pointing to your host
- [ ] SSL certificate active (automatic on Render and Fly)
- [ ] `www` redirect configured if needed

### Monitoring
- [ ] Error tracking set up (Sentry, Honeybadger, or Rollbar)
- [ ] Uptime monitoring on `/up` endpoint (UptimeRobot, Better Uptime)
- [ ] Log aggregation configured (Render/Fly provide built-in logs)

### Performance
- [ ] `WEB_CONCURRENCY=2` (Puma workers — adjust based on RAM)
- [ ] `RAILS_MAX_THREADS=5` (threads per worker)
- [ ] CDN in front of static assets (automatic on Render static sites)
