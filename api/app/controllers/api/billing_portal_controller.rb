# frozen_string_literal: true

module Api
  class BillingPortalController < ApplicationController
    before_action :authenticate_user!

    # POST /api/billing-portal — creates Stripe Customer Portal session
    def create
      subscription = current_user.subscriptions.order(created_at: :desc).first

      unless subscription&.stripe_customer_id.present?
        return render json: { error: "No active billing account" }, status: :not_found
      end

      session = Stripe::BillingPortal::Session.create(
        customer: subscription.stripe_customer_id,
        return_url: "#{frontend_url}/billing"
      )

      render json: { url: session.url }, status: :ok
    rescue Stripe::StripeError => e
      render json: { error: e.message }, status: :unprocessable_entity
    end

    private

    def frontend_url
      ENV.fetch("FRONTEND_URL", "http://localhost:5173")
    end
  end
end
