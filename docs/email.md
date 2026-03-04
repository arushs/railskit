# Email System

RailsKit ships with a production-ready email system — adapter-based delivery,
branded templates, preview support, and inbound email processing.

## Configuration

Set your provider in `railskit.yml`:

```yaml
email:
  provider: "resend"  # resend | postmark | smtp
  from: "MyApp <noreply@myapp.com>"
```

Then add the required environment variable:

| Provider  | Required ENV              |
|-----------|---------------------------|
| Resend    | `RESEND_API_KEY`          |
| Postmark  | `POSTMARK_API_TOKEN`      |
| SMTP      | `SMTP_ADDRESS`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD` |

## Adapters

The email system follows the same adapter pattern as payments. Each adapter
lives in `app/services/email_provider/` and implements:

- `delivery_config` — returns `{ method:, settings: }` for ActionMailer
- `provider_name` — human-readable identifier

### Resend (default)

Uses Resend's SMTP relay — no extra gems needed. Just set `RESEND_API_KEY`.

### Postmark

Uses Postmark's SMTP relay. Set `POSTMARK_API_TOKEN`.

### Generic SMTP

For Mailgun, SendGrid, AWS SES, or self-hosted servers. Configure via ENV:

```bash
SMTP_ADDRESS=smtp.mailgun.org
SMTP_PORT=587
SMTP_USERNAME=postmaster@mg.myapp.com
SMTP_PASSWORD=secret
SMTP_DOMAIN=myapp.com
```

## Email Templates

All templates include both HTML and plain-text versions with responsive,
branded layouts.

### User Emails (`UserMailer`)

| Email            | Method                           | Triggered by            |
|------------------|----------------------------------|-------------------------|
| Welcome          | `UserMailer.welcome(user)`       | After registration      |
| Magic Link       | `UserMailer.magic_link(user, token:, expires_in:)` | Sign-in request |
| Password Reset   | `UserMailer.password_reset(user, token:)` | Reset request   |

### Transactional Emails (`TransactionalMailer`)

| Email                    | Method                                                | Triggered by        |
|--------------------------|-------------------------------------------------------|---------------------|
| Subscription Confirmed   | `TransactionalMailer.subscription_confirmation(user, subscription:)` | Successful payment |
| Invoice Receipt          | `TransactionalMailer.invoice_receipt(user, invoice:)` | Each charge         |

## Previewing Emails

In development, visit:

```
http://localhost:3000/rails/mailers
```

This shows all email previews powered by `test/mailers/previews/`. The
`letter_opener` gem is also included — emails sent in dev open in your browser
instead of actually sending.

## Inbound Email (ActionMailbox)

Basic ActionMailbox routing is set up in `app/mailboxes/application_mailbox.rb`.
By default, unmatched emails go to the catch-all mailbox which logs and discards.

To add a support mailbox:

```ruby
# app/mailboxes/application_mailbox.rb
routing /support@/i => :support

# app/mailboxes/support_mailbox.rb
class SupportMailbox < ApplicationMailbox
  def process
    # Create a support ticket from the inbound email
    Ticket.create!(
      from: mail.from.first,
      subject: mail.subject,
      body: mail.body.decoded
    )
  end
end
```

Configure your email provider to forward inbound emails to:
`/rails/action_mailbox/inbound_emails` (see Rails guides for provider-specific setup).

## Customization

### Change the layout

Edit `app/views/layouts/mailer.html.erb`. The layout uses your theme's
`primary_color` from `railskit.yml` for the header and buttons.

### Change the from address

Set `email.from` in `railskit.yml`, or it defaults to
`{app.name} <noreply@{app.domain}>`.

### Add a new email

1. Add the method to the appropriate mailer
2. Create `app/views/{mailer_name}/{method}.html.erb` and `.text.erb`
3. Add a preview in `test/mailers/previews/`
4. Write a test in `test/mailers/`
