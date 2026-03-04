# RailsKit

Monorepo scaffold: Rails 8 API + React (Vite) + Docker.

## Structure

```
api/    — Rails 8 API-only (PostgreSQL)
web/    — React + Vite + TypeScript + TailwindCSS v4
```

## Quick Start

```bash
# Install dependencies
cd api && bundle install && cd ..
cd web && npm install && cd ..

# Start both servers
bin/dev
```

- **API:** http://localhost:3000
- **Web:** http://localhost:5173
- **Health:** http://localhost:5173/api/health (proxied)

## Docker

```bash
docker compose up
```

## Environment

Copy `.env.example` to `.env` and adjust as needed.
