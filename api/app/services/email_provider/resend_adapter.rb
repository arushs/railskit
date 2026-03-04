# frozen_string_literal: true

module EmailProvider
  # Resend adapter — uses Resend's SMTP relay so we don't need the resend gem.
  # This keeps the dependency footprint minimal while supporting Resend out of the box.
  #
  # Required ENV:
  #   RESEND_API_KEY — your Resend API key (used as SMTP password)
  #
  # Optional railskit.yml overrides under email.resend:
  #   domain: "yourdomain.com"
  class ResendAdapter < Base
    SMTP_HOST = "smtp.resend.com"
    SMTP_PORT = 465

    def delivery_config
      {
        method: :smtp,
        settings: {
          address:              SMTP_HOST,
          port:                 SMTP_PORT,
          user_name:            "resend",
          password:             api_key,
          authentication:       :plain,
          enable_starttls_auto: false,
          ssl:                  true
        }
      }
    end

    def provider_name
      "Resend"
    end

    private

    def api_key
      ENV.fetch("RESEND_API_KEY") do
        raise EmailProvider::DeliveryError,
              "RESEND_API_KEY is required. Get one at https://resend.com/api-keys"
      end
    end
  end
end
