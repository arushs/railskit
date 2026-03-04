# frozen_string_literal: true

class ApplicationMailer < ActionMailer::Base
  default from: -> { default_from_address }
  layout "mailer"

  private

  def self.default_from_address
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
end
