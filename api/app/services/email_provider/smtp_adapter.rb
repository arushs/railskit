# frozen_string_literal: true

module EmailProvider
  # Generic SMTP adapter — for Mailgun, SendGrid, AWS SES, self-hosted, etc.
  #
  # Required ENV:
  #   SMTP_ADDRESS  — SMTP server hostname
  #   SMTP_PORT     — defaults to 587
  #   SMTP_USERNAME — optional
  #   SMTP_PASSWORD — optional
  #   SMTP_DOMAIN   — HELO domain, defaults to app domain from railskit.yml
  class SmtpAdapter < Base
    def delivery_config
      settings = {
        address:              ENV.fetch("SMTP_ADDRESS", "localhost"),
        port:                 ENV.fetch("SMTP_PORT", 587).to_i,
        domain:               ENV.fetch("SMTP_DOMAIN", RailsKit.config.app.domain),
        enable_starttls_auto: true
      }

      if ENV["SMTP_USERNAME"].present?
        settings[:user_name]     = ENV["SMTP_USERNAME"]
        settings[:password]      = ENV["SMTP_PASSWORD"]
        settings[:authentication] = :plain
      end

      { method: :smtp, settings: settings }
    end

    def provider_name
      "SMTP (#{ENV.fetch('SMTP_ADDRESS', 'localhost')})"
    end
  end
end
