# frozen_string_literal: true

# Abstract interface for payment providers (Stripe, Lemon Squeezy, etc.)
module PaymentProvider
  class Base
    def create_checkout_session(user:, plan:, success_url:, cancel_url:)
      raise NotImplementedError
    end

    def create_portal_session(customer_id:, return_url:)
      raise NotImplementedError
    end

    def construct_webhook_event(payload:, signature:)
      raise NotImplementedError
    end

    def cancel_subscription(subscription_id:)
      raise NotImplementedError
    end

    def retrieve_subscription(subscription_id:)
      raise NotImplementedError
    end
  end
end
