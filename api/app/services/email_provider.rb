# frozen_string_literal: true

# Abstract interface for email providers (Resend, Postmark, SMTP).
# Mirrors the PaymentProvider pattern — each adapter implements the same API,
# and the concrete provider is chosen via railskit.yml → email.provider.
module EmailProvider
  class DeliveryError < StandardError; end

  class Base
    # Returns a delivery_method + settings hash that ActionMailer can consume.
    # e.g. { method: :smtp, settings: { address: "...", ... } }
    def delivery_config
      raise NotImplementedError
    end

    # Human-readable name for logs / diagnostics.
    def provider_name
      raise NotImplementedError
    end
  end

  # Registry -----------------------------------------------------------------

  PROVIDERS = {
    "resend"   => "EmailProvider::ResendAdapter",
    "postmark" => "EmailProvider::PostmarkAdapter",
    "smtp"     => "EmailProvider::SmtpAdapter"
  }.freeze

  class << self
    def adapter
      @adapter ||= resolve(RailsKit.config.email.provider)
    end

    def reload!
      @adapter = nil
    end

    private

    def resolve(name)
      klass_name = PROVIDERS[name.to_s]
      raise ArgumentError, "Unknown email provider: #{name}. Valid: #{PROVIDERS.keys.join(', ')}" unless klass_name

      klass_name.constantize.new
    end
  end
end
