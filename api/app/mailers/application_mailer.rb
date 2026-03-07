# frozen_string_literal: true

class ApplicationMailer < ActionMailer::Base
  default from: -> { default_from_address }
  layout "mailer"

  private

  def default_from_address
    app_name = RailsKit.config.app.name
    domain   = RailsKit.config.app.domain

    # Try email.from from railskit.yml, fall back to app name + domain
    from = begin
      RailsKit.config.email.from
    rescue NoMethodError
      nil
    end

    from || "#{app_name} <noreply@#{domain}>"
  end

  # Helper available to all mailers — sets consistent subject prefix.
  def branded_subject(text)
    "[#{RailsKit.config.app.name}] #{text}"
  end

  # Frontend URL helpers for mailer templates.
  def frontend_url
    @frontend_url ||= ENV.fetch("FRONTEND_URL", "http://localhost:5173")
  end

  def magic_link_url(token:)
    "#{frontend_url}/auth/magic-link/verify?token=#{token}"
  end

  def password_reset_url(token:)
    "#{frontend_url}/auth/reset-password?token=#{token}"
  end

  def billing_portal_url
    "#{frontend_url}/dashboard/billing"
  end
end
