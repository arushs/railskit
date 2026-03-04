# frozen_string_literal: true

module PaymentProvider
  class StripeAdapter < Base
    def create_checkout_session(user:, plan:, success_url:, cancel_url:)
      session = Stripe::Checkout::Session.create(
        customer: find_or_create_customer(user),
        mode: "subscription",
        line_items: [{ price: plan.stripe_price_id, quantity: 1 }],
        success_url: success_url,
        cancel_url: cancel_url,
        subscription_data: {
          metadata: { user_id: user.id, plan_id: plan.id }
        },
        metadata: { user_id: user.id, plan_id: plan.id }
      )
      { url: session.url, session_id: session.id }
    end

    def create_portal_session(customer_id:, return_url:)
      session = Stripe::BillingPortal::Session.create(
        customer: customer_id,
        return_url: return_url
      )
      { url: session.url }
    end

    def construct_webhook_event(payload:, signature:)
      Stripe::Webhook.construct_event(
        payload, signature, Rails.application.config.stripe.webhook_secret
      )
    end

    def cancel_subscription(subscription_id:)
      Stripe::Subscription.cancel(subscription_id)
    end

    def retrieve_subscription(subscription_id:)
      Stripe::Subscription.retrieve(subscription_id)
    end

    private

    def find_or_create_customer(user)
      existing = Subscription.where(user: user).order(created_at: :desc).first
      return existing.stripe_customer_id if existing&.stripe_customer_id.present?

      customer = Stripe::Customer.create(
        email: user.email,
        metadata: { user_id: user.id }
      )
      customer.id
    end
  end
end
