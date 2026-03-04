# Deployment Guide

RailsKit supports multiple deployment targets. Render is recommended for the fastest path to production.

---

## Render (Recommended)

Render gives you managed infrastructure with zero DevOps. The included `render.yaml` blueprint configures everything.

### One-Click Deploy

1. Push your code to GitHub
2. [Render Dashboard](https://dashboard.render.com/) → **New** → **Blueprint**
3. Connect your repo
4. Render reads `render.yaml` and provisions:
   - **Web Service** — Rails API
   - **Static Site** — React frontend (built by Vite)
   - **Background Worker** — Solid Queue
   - **PostgreSQL** — Database (if using Postgres adapter)

### render.yaml

```yaml
services:
  - type: web
    name: railskit-api
    runtime: ruby
    buildCommand: cd api && bundle install && bin/rails db:migrate
    startCommand: cd api && bin/rails server -p $PORT
    envVars:
      - key: RAILS_ENV
        value: production
      - key: RAILS_MASTER_KEY
        sync: false
      - key: DATABASE_URL
        fromDatabase:
          name: railskit-db
          property: connectionString

  - type: web
    name: railskit-web
    runtime: static
    buildCommand: cd web && npm install && npm run build
    staticPublishPath: web/dist
    routes:
      - type: rewrite
        source: /*
        destination: /index.html

  - type: worker
    name: railskit-worker
    runtime: ruby
    buildCommand: cd api && bundle install
    startCommand: cd api && bin/rails solid_queue:start
    envVars:
      - key: RAILS_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: railskit-db
          property: connectionString

databases:
  - name: railskit-db
    plan: starter
```

### Custom Domain

1. Render dashboard → your static site → **Settings** → **Custom Domain**
2. Add your domain (e.g., `myapp.com`)
3. DNS records:
   - `A` → Render's IP (shown in dashboard)
   - `CNAME` for `www` → `your-site.onrender.com`
4. SSL is automatic

### Production CORS

```ruby
# api/config/initializers/cors.rb
origins ENV.fetch("FRONTEND_URL", "https://myapp.com")
```

Set `FRONTEND_URL` in Render environment variables.

---

## Docker (Universal)

Works anywhere: Railway, Fly.io, AWS, DigitalOcean, bare metal.

### Quick Start

```bash
docker compose -f docker-compose.prod.yml up -d
```

### Production Docker Compose

```yaml
# docker-compose.prod.yml
services:
  api:
    build:
      context: ./api
      dockerfile: Dockerfile.prod
    ports:
      - "3000:3000"
    environment:
      RAILS_ENV: production
      DATABASE_URL: postgres://user:pass@db:5432/railskit_prod
      RAILS_MASTER_KEY: ${RAILS_MASTER_KEY}
    depends_on:
      - db

  web:
    build:
      context: ./web
      dockerfile: Dockerfile.prod
    ports:
      - "80:80"
      - "443:443"

  worker:
    build:
      context: ./api
      dockerfile: Dockerfile.prod
    command: bin/rails solid_queue:start
    environment:
      RAILS_ENV: production
      DATABASE_URL: postgres://user:pass@db:5432/railskit_prod
    depends_on:
      - db

  db:
    image: postgres:16
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: railskit_prod

volumes:
  pgdata:
```

---

## Railway

1. New project on [Railway](https://railway.app)
2. Add **PostgreSQL** service
3. Add **GitHub Repo** for API (root dir: `api`)
   - Build: `bundle install && bin/rails db:migrate`
   - Start: `bin/rails server -b 0.0.0.0 -p $PORT`
4. Add another service for frontend (root dir: `web`)
   - Build: `npm install && npm run build`
   - Start: `npx serve dist -s -l $PORT`
5. Set environment variables

---

## Fly.io

```bash
cd api && fly launch --name myapp-api && fly deploy
cd ../web && fly launch --name myapp-web && fly deploy
```

RailsKit includes starter `fly.toml` configs for both services.

---

## Convex / Supabase Notes

If using Convex or Supabase as your database, there's no database to deploy — they're hosted services. You only deploy the Rails API + React frontend.

- **Convex:** Set `CONVEX_URL` and `CONVEX_DEPLOY_KEY`. Run `npx convex deploy` for schema changes.
- **Supabase:** Set `SUPABASE_URL` and `SUPABASE_KEY`. Run migrations via Supabase CLI.

---

## Production Checklist

### Security

- [ ] `RAILS_ENV=production`
- [ ] `RAILS_MASTER_KEY` set (never commit `master.key`)
- [ ] JWT secret is unique and strong
- [ ] CORS restricted to your domain
- [ ] `force_ssl` enabled in Rails production config
- [ ] All API keys in env vars, not in code

### Stripe

- [ ] Switched from `sk_test_` to `sk_live_` keys
- [ ] Webhook endpoint registered (production URL)
- [ ] Webhook secret updated
- [ ] Tested a real payment in test mode

### Email

- [ ] DNS records configured (SPF, DKIM, DMARC)
- [ ] Test emails send correctly from production domain
- [ ] From address matches domain

### DNS & SSL

- [ ] A/CNAME records pointing to host
- [ ] SSL certificate active
- [ ] `www` redirect configured

### Monitoring

- [ ] Error tracking (Sentry, Honeybadger)
- [ ] Uptime monitoring (UptimeRobot, Better Uptime)
- [ ] Log aggregation (host-provided or Papertrail)
