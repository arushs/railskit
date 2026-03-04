# frozen_string_literal: true

# Configure ActionMailer delivery based on railskit.yml email.provider.
#
# In development, defaults to :letter_opener if available, or :smtp to localhost.
# In test, always uses :test.
# In production, resolves the adapter from EmailProvider.
Rails.application.config.after_initialize do
  next if Rails.env.test?

  if Rails.env.development?
    # Use letter_opener in dev if the gem is present; otherwise fall through
    # to the configured provider (useful for testing real delivery locally).
    if defined?(LetterOpener)
      Rails.application.config.action_mailer.delivery_method = :letter_opener
      next
    end
  end

  adapter  = EmailProvider.adapter
  delivery = adapter.delivery_config

  Rails.application.config.action_mailer.delivery_method = delivery[:method]
  Rails.application.config.action_mailer.smtp_settings   = delivery[:settings]

  Rails.logger.info("[RailsKit] Email provider: #{adapter.provider_name}")
end
