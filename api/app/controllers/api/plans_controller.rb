# frozen_string_literal: true

module Api
  class PlansController < ApplicationController
    # GET /api/plans — public, no auth required
    def index
      plans = Plan.active.ordered
      render json: { plans: plans.map { |p| serialize_plan(p) } }
    end

    private

    def serialize_plan(plan)
      {
        id: plan.id,
        name: plan.name,
        slug: plan.slug,
        stripe_price_id: plan.stripe_price_id,
        interval: plan.interval,
        amount_cents: plan.amount_cents,
        currency: plan.currency,
        features: plan.features,
        display_price: plan.display_price
      }
    end
  end
end
