# frozen_string_literal: true

Stripe.api_key = ENV.fetch("STRIPE_SECRET_KEY", nil)
Stripe.api_version = "2024-12-18.acacia"

Rails.application.config.stripe = ActiveSupport::OrderedOptions.new
Rails.application.config.stripe.webhook_secret = ENV.fetch("STRIPE_WEBHOOK_SECRET", nil)
