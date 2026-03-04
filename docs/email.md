# Email System

RailsKit ships with adapter-based email delivery, dev preview support, and inbound email processing via ActionMailbox.

---

## Providers

Three email providers are supported out of the box:

| Provider | How It Works | Required ENV |
|---|---|---|
| **Resend** (default) | SMTP relay via `smtp.resend.com:465` | `RESEND_API_KEY` |
| **Postmark** | SMTP relay | `POSTMARK_API_TOKEN` |
| **SMTP** | Bring your own server | `SMTP_ADDRESS`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD` |

Set in `railskit.yml`:
```yaml
email:
  provider: "resend"
  from: "RailsKit <noreply@yourdomain.com>"
```

All providers use ActionMailer's SMTP delivery — no extra gems needed. The `EmailProvider` adapter translates your config into SMTP settings.

---

## How It Works

### Adapter Pattern

`EmailProvider::Base` defines the interface:
```ruby
class EmailProvider::Base
  def delivery_config    # → { method: :smtp, settings: { ... } }
  def provider_name      # → "Resend"
end
```

Each adapter implements `delivery_config` returning SMTP settings that ActionMailer consumes directly.

### Initialization

`api/config/initializers/email.rb` runs at boot:
- **Test:** Uses `:test` delivery (no emails sent)
- **Development:** Uses `letter_opener` if available (opens emails in browser), otherwise falls through to the configured provider
- **Production:** Resolves the adapter from `RailsKit.config.email.provider` and configures ActionMailer

### Resend Adapter

```ruby
module EmailProvider
  class ResendAdapter < Base
    def delivery_config
      {
        method: :smtp,
        settings: {
          address: "smtp.resend.com",
          port: 465,
          user_name: "resend",
          password: ENV.fetch("RESEND_API_KEY"),
          authentication: :plain,
          ssl: true
        }
      }
    end
  end
end
```

---

## Development

In development, emails open in your browser via `letter_opener`:

```ruby
# Gemfile (already included)
group :development do
  gem "letter_opener", "~> 1.10"
end
```

Send a test email from the Rails console:
```ruby
MagicLinkMailer.login_link(User.first, "test-token").deliver_now
# Opens in browser automatically
```

---

## Included Mailers

| Mailer | Purpose |
|---|---|
| `MagicLinkMailer` | Magic link login emails |
| `TransactionalMailer` | Invoice receipts, subscription confirmations |
| `UserMailer` | Welcome emails, password resets |

---

## Inbound Email

RailsKit includes ActionMailbox (`gem "actionmailbox"`) for processing incoming emails. This is useful for:
- Support ticket creation from email
- Email-based commands
- Reply tracking

Configure your inbound email routing in `api/config/environments/production.rb` and create mailboxes in `api/app/mailboxes/`.

---

## Switching Providers

Edit `railskit.yml` and update your ENV:

```yaml
email:
  provider: "postmark"
```

```bash
# .env
POSTMARK_API_TOKEN=your-token
```

Restart `bin/dev`. No code changes needed.
