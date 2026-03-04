# frozen_string_literal: true

module EmailProvider
  # Postmark adapter — uses Postmark's SMTP relay.
  #
  # Required ENV:
  #   POSTMARK_API_TOKEN — your Postmark server API token
  class PostmarkAdapter < Base
    SMTP_HOST = "smtp.postmarkapp.com"
    SMTP_PORT = 587

    def delivery_config
      {
        method: :smtp,
        settings: {
          address:              SMTP_HOST,
          port:                 SMTP_PORT,
          user_name:            api_token,
          password:             api_token,
          authentication:       :plain,
          enable_starttls_auto: true
        }
      }
    end

    def provider_name
      "Postmark"
    end

    private

    def api_token
      ENV.fetch("POSTMARK_API_TOKEN") do
        raise EmailProvider::DeliveryError,
              "POSTMARK_API_TOKEN is required. Get one at https://postmarkapp.com"
      end
    end
  end
end
