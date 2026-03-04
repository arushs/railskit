# frozen_string_literal: true

module Api
  module Webhooks
    class StripeController < ApplicationController
      skip_before_action :authenticate_user!, raise: false

      # POST /api/webhooks/stripe
      def create
        payload = request.body.read
        sig_header = request.env["HTTP_STRIPE_SIGNATURE"]
        webhook_secret = Rails.application.config.stripe.webhook_secret

        begin
          event = Stripe::Webhook.construct_event(payload, sig_header, webhook_secret)
        rescue JSON::ParserError, Stripe::SignatureVerificationError
          return head :bad_request
        end

        handle_event(event)
        head :ok
      end

      private

      def handle_event(event)
        case event.type
        when "checkout.session.completed"
          handle_checkout_completed(event.data.object)
        when "customer.subscription.updated"
          handle_subscription_updated(event.data.object)
        when "customer.subscription.deleted"
          handle_subscription_deleted(event.data.object)
        when "invoice.payment_failed"
          handle_payment_failed(event.data.object)
        else
          Rails.logger.info("[Stripe] Unhandled event type: #{event.type}")
        end
      end

      def handle_checkout_completed(session)
        user_id = session.metadata["user_id"]
        plan_id = session.metadata["plan_id"]
        return unless user_id && plan_id

        user = User.find_by(id: user_id)
        plan = Plan.find_by(id: plan_id)
        return unless user && plan

        stripe_sub = Stripe::Subscription.retrieve(session.subscription)

        Subscription.create!(
          user: user,
          plan: plan,
          stripe_subscription_id: stripe_sub.id,
          stripe_customer_id: session.customer,
          status: stripe_sub.status,
          current_period_start: Time.at(stripe_sub.current_period_start).utc,
          current_period_end: Time.at(stripe_sub.current_period_end).utc
        )

        Rails.logger.info("[Stripe] Subscription created for user #{user_id}, plan #{plan_id}")
      end

      def handle_subscription_updated(stripe_sub)
        subscription = Subscription.find_by(stripe_subscription_id: stripe_sub.id)
        return unless subscription

        if stripe_sub.items.data.first
          new_price_id = stripe_sub.items.data.first.price.id
          new_plan = Plan.find_by(stripe_price_id: new_price_id)
          subscription.plan = new_plan if new_plan
        end

        subscription.update!(
          status: stripe_sub.status,
          current_period_start: Time.at(stripe_sub.current_period_start).utc,
          current_period_end: Time.at(stripe_sub.current_period_end).utc,
          cancel_at: stripe_sub.cancel_at ? Time.at(stripe_sub.cancel_at).utc : nil,
          canceled_at: stripe_sub.canceled_at ? Time.at(stripe_sub.canceled_at).utc : nil
        )

        Rails.logger.info("[Stripe] Subscription #{stripe_sub.id} updated: #{stripe_sub.status}")
      end

      def handle_subscription_deleted(stripe_sub)
        subscription = Subscription.find_by(stripe_subscription_id: stripe_sub.id)
        return unless subscription

        subscription.update!(status: "canceled", canceled_at: Time.current)
        Rails.logger.info("[Stripe] Subscription #{stripe_sub.id} canceled")
      end

      def handle_payment_failed(invoice)
        subscription = Subscription.find_by(stripe_subscription_id: invoice.subscription)
        return unless subscription

        subscription.update!(status: "past_due")
        Rails.logger.warn("[Stripe] Payment failed for subscription #{invoice.subscription}")
      end
    end
  end
end
