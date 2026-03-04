# frozen_string_literal: true

module Api
  class CheckoutController < ApplicationController
    before_action :authenticate_user!

    # POST /api/checkout — creates Stripe Checkout session
    def create
      plan = Plan.find_by!(stripe_price_id: params.require(:price_id))
      customer_id = current_user_stripe_customer_id

      session = Stripe::Checkout::Session.create(
        customer: customer_id,
        mode: "subscription",
        line_items: [{ price: plan.stripe_price_id, quantity: 1 }],
        success_url: "#{frontend_url}/billing?session_id={CHECKOUT_SESSION_ID}",
        cancel_url: "#{frontend_url}/pricing",
        subscription_data: {
          metadata: { user_id: current_user.id, plan_id: plan.id }
        },
        metadata: { user_id: current_user.id, plan_id: plan.id }
      )

      render json: { url: session.url }, status: :ok
    rescue ActiveRecord::RecordNotFound
      render json: { error: "Plan not found" }, status: :not_found
    rescue Stripe::StripeError => e
      render json: { error: e.message }, status: :unprocessable_entity
    end

    private

    def frontend_url
      ENV.fetch("FRONTEND_URL", "http://localhost:5173")
    end

    def current_user_stripe_customer_id
      existing = Subscription.where(user: current_user).order(created_at: :desc).first
      return existing.stripe_customer_id if existing&.stripe_customer_id.present?

      customer = Stripe::Customer.create(
        email: current_user.email,
        metadata: { user_id: current_user.id }
      )
      customer.id
    end
  end
end
