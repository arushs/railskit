# Scaling Guide

RailsKit's defaults are optimized for launch speed. This guide covers when and how to upgrade each component.

---

## Background Jobs

### Default: Solid Queue in Puma

Out of the box, Solid Queue runs inside the Puma web process (`SOLID_QUEUE_IN_PUMA=true`). This means:
- No extra process to manage
- Jobs share resources with web requests
- Fine for low-to-moderate job volume

### When to Split

**Split when:** Job processing causes noticeable web request latency, or you have >100 jobs/minute.

**How:**
```bash
# Set env var
SOLID_QUEUE_IN_PUMA=false

# Run a dedicated worker process
bin/rails solid_queue:start
```

Update your Procfile.dev:
```
api: cd api && bin/rails server -p 3000
web: cd web && npm run dev
worker: cd api && bin/rails solid_queue:start
```

### When to Add Redis + Sidekiq

**When:** You need advanced job features (rate limiting, batch jobs, cron) or >1000 jobs/minute.

**How:** Add `sidekiq` to your Gemfile, configure `config.active_job.queue_adapter = :sidekiq`, and run a Redis instance.

---

## Database

### Default: PostgreSQL (Single Instance)

Works for most apps up to ~100K users and millions of rows.

### When to Optimize

**Add read replicas when:** Read-heavy workload, >50% of queries are reads.

**Add connection pooling when:** Running multiple Puma workers + background jobs. Use PgBouncer.

**Add indexes for:** Agent conversation queries. The default migrations index `chats.agent_class`, `messages.role`, and `messages.created_at`. Add more based on your query patterns.

---

## ActionCable / WebSockets

### Default: Solid Cable

Solid Cable uses the database as the pub/sub backend. Fine for:
- Single server deployments
- Low-to-moderate concurrent WebSocket connections (<500)

### When to Switch to Redis

**When:** Multiple servers need to share WebSocket state, or >500 concurrent connections.

```yaml
# config/cable.yml
production:
  adapter: redis
  url: <%= ENV["REDIS_URL"] %>
```

---

## Caching

### Default: Solid Cache

Database-backed cache. Simple, no extra infrastructure.

### When to Switch to Redis

**When:** Cache hit rate matters for performance, or you need sub-millisecond cache reads.

```yaml
# config/cache.yml (or in environment config)
production:
  store: redis_cache_store
  url: <%= ENV["REDIS_URL"] %>
```

---

## AI / Agent Scaling

### Token Cost Monitoring

The `Message` model tracks `input_tokens` and `output_tokens` for every agent interaction. Use these to monitor costs:

```ruby
# Total tokens this month
Message.where("created_at > ?", 1.month.ago).sum(:input_tokens)
Message.where("created_at > ?", 1.month.ago).sum(:output_tokens)

# Per-agent breakdown
Chat.group(:agent_class).joins(:messages)
    .sum("messages.input_tokens + messages.output_tokens")
```

The agent dashboard at `/agents/costs` visualizes this data.

### Model Selection

Use cheaper models for simple tasks:

```ruby
# Triage agent uses a small model
class TriageAgent
  def initialize(conversation: nil)
    @llm_chat = conversation ? conversation.to_llm_chat(model: "gpt-4o-mini") : RubyLLM.chat(model: "gpt-4o-mini")
    @llm_chat.with_instructions("Classify the user's intent...")
  end
end

# Complex analysis uses a larger model
class AnalysisAgent
  def initialize(conversation: nil)
    @llm_chat = conversation ? conversation.to_llm_chat(model: "claude-opus-4-20250514") : RubyLLM.chat(model: "claude-opus-4-20250514")
    @llm_chat.with_instructions("Provide detailed analysis...")
  end
end
```

### Rate Limiting (Coming Soon)

Per-user and per-plan rate limiting for agent endpoints is planned. In the meantime, implement basic rate limiting with `rack-attack`:

```ruby
# Gemfile
gem "rack-attack"

# config/initializers/rack_attack.rb
Rack::Attack.throttle("api/agents", limit: 20, period: 60) do |req|
  if req.path.start_with?("/api/agents")
    req.env["warden"]&.user(:user)&.id
  end
end
```

---

## Frontend

### Default: Vite Dev Server + Static Build

The React app is a static SPA. In production, `npm run build` generates static files served from any CDN.

### When to Optimize

**Add a CDN when:** You have global users. Cloudflare, CloudFront, or Vercel Edge work out of the box with the static build.

**Add SSR when:** SEO matters for authenticated pages. For most SaaS apps, the landing page is static and dashboard pages don't need SEO — so SSR is rarely needed.

---

## Deployment Scaling

| Scale | Approach |
|---|---|
| 0–1K users | Single server, Solid Queue in Puma, Solid Cable |
| 1K–10K users | Add Redis, split background workers, add read replica |
| 10K–100K users | Multiple web servers, load balancer, dedicated job servers, CDN |
| 100K+ | Horizontal scaling, database sharding, dedicated AI inference |

RailsKit's adapter pattern means you can swap components without rewriting application code.
