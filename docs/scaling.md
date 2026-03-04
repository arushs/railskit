# Scaling Guide

RailsKit's defaults are optimized for launch speed. This guide covers when and how to upgrade each component.

---

## When to Scale

| Signal | Upgrade | Threshold |
|---|---|---|
| API response times > 500ms | Database queries, caching | ~1000 req/min |
| Background jobs backing up | Solid Queue → Sidekiq + Redis | ~1000 jobs/min |
| WebSocket connections dropping | ActionCable adapter | ~500 concurrent |
| Agent costs rising fast | Model selection, caching | > $50/day |
| Database CPU > 80% | Postgres plan, read replicas | Varies |

---

## Database

### PostgreSQL Scaling Path

**1. Add indexes** (handles 10x growth alone):

```ruby
add_index :projects, [:user_id, :status]
add_index :chats, [:user_id, :created_at]
add_index :messages, :chat_id
```

**2. Connection pooling** — PgBouncer when you hit connection limits (~20-100).

**3. Read replicas** — Route dashboards/reports to a replica:

```ruby
# config/database.yml
production:
  primary:
    url: <%= ENV['DATABASE_URL'] %>
  replica:
    url: <%= ENV['DATABASE_REPLICA_URL'] %>
    replica: true
```

**4. Vertical scaling** — Bigger instance before sharding. Simpler is better.

### Convex / Supabase

Both handle scaling automatically. Monitor usage in their dashboards. Upgrade plans as needed.

---

## Background Jobs: Solid Queue → Sidekiq

Solid Queue uses your database as the queue. Good up to ~1000 jobs/minute.

### Switching

```ruby
# Gemfile
gem "sidekiq"

# config/application.rb
config.active_job.queue_adapter = :sidekiq
```

Add Redis to your docker-compose and Procfile.

---

## WebSockets at Scale

### Default → Redis Adapter

```yaml
# config/cable.yml
production:
  adapter: redis
  url: <%= ENV['REDIS_URL'] %>
  channel_prefix: railskit_production
```

### High Scale → AnyCable

For 10,000+ concurrent connections:

```ruby
gem "anycable-rails"
```

AnyCable uses a Go-based WebSocket server — dramatically more efficient than Ruby ActionCable.

---

## Agent Cost Optimization

### Model Selection

Not every query needs the best model:

| Use Case | Model | Cost |
|---|---|---|
| Simple Q&A, routing | `gpt-4o-mini` | $0.15/1M input |
| Code review, analysis | `claude-sonnet-4` | Higher, but better reasoning |
| Creative, general | `gemini-2.0-flash` | Good balance |

### Response Caching

```ruby
class FaqAgent < RubyLLM::Agent
  def ask(message)
    cache_key = "faq:#{Digest::SHA256.hexdigest(message.downcase.strip)}"
    Rails.cache.fetch(cache_key, expires_in: 1.hour) { super(message) }
  end
end
```

### Token Limits

```ruby
class ConciseAgent < RubyLLM::Agent
  max_tokens 500  # Prevent runaway responses
end
```

### Monitoring

Use the Agent Dashboard (`/dashboard/agents`) to identify expensive agents and conversations.

---

## Caching

### Add Redis Caching

```ruby
# config/environments/production.rb
config.cache_store = :redis_cache_store, {
  url: ENV['REDIS_URL'],
  expires_in: 1.hour
}
```

### What to Cache

```ruby
# Expensive aggregations
Rails.cache.fetch("dashboard:#{current_user.id}", expires_in: 5.minutes) do
  { projects: current_user.projects.count, ... }
end

# Slow-changing data
Rails.cache.fetch("plans", expires_in: 1.hour) { Plan.all.as_json }
```

---

## Horizontal Scaling

Rails is stateless with JWT auth. Run multiple API instances behind a load balancer.

Requirements:
- Redis for ActionCable (shared across instances)
- Redis for caching
- Workers run separately from web processes

### CDN for Frontend

React builds to static files. Serve from a CDN:
- **Render:** Built-in CDN
- **Cloudflare:** Put in front of your frontend
- **AWS:** S3 + CloudFront

---

## Recommended Monitoring

| Tool | Purpose | Cost |
|---|---|---|
| [Sentry](https://sentry.io) | Error tracking | Free tier |
| [Scout APM](https://scoutapm.com) | Rails performance | Free for small apps |
| [UptimeRobot](https://uptimerobot.com) | Uptime monitoring | Free for 50 monitors |

### Key Metrics

- **p95 response time** — Keep under 200ms
- **Error rate** — Should be < 0.1%
- **Job queue depth** — Should stay near zero
- **Agent cost/day** — Track against budget
