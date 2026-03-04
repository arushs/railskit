# frozen_string_literal: true

module PaymentProvider
  # Lemon Squeezy adapter stub — same interface as StripeAdapter.
  # Set payments.provider: lemon_squeezy in railskit.yml to use.
  # Docs: https://docs.lemonsqueezy.com/api
  class LemonSqueezyAdapter < Base
    def create_checkout_session(user:, plan:, success_url:, cancel_url:)
      # POST https://api.lemonsqueezy.com/v1/checkouts
      raise NotImplementedError, "Lemon Squeezy checkout not yet implemented"
    end

    def create_portal_session(customer_id:, return_url:)
      # Use subscription.urls.customer_portal
      raise NotImplementedError, "Lemon Squeezy portal not yet implemented"
    end

    def construct_webhook_event(payload:, signature:)
      # Verify HMAC-SHA256 with LEMON_SQUEEZY_WEBHOOK_SECRET
      raise NotImplementedError, "Lemon Squeezy webhooks not yet implemented"
    end

    def cancel_subscription(subscription_id:)
      # PATCH https://api.lemonsqueezy.com/v1/subscriptions/:id
      raise NotImplementedError, "Lemon Squeezy cancellation not yet implemented"
    end

    def retrieve_subscription(subscription_id:)
      # GET https://api.lemonsqueezy.com/v1/subscriptions/:id
      raise NotImplementedError, "Lemon Squeezy retrieval not yet implemented"
    end
  end
end
