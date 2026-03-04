# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Stripe Webhooks", type: :request do
  let(:webhook_secret) { "whsec_test_secret" }

  before do
    allow(Rails.application.config).to receive(:stripe).and_return(
      OpenStruct.new(webhook_secret: webhook_secret)
    )
  end

  def post_webhook(event_type, data_object, metadata: {})
    event = {
      id: "evt_#{SecureRandom.hex(12)}",
      type: event_type,
      data: { object: data_object.merge(metadata.any? ? { metadata: metadata } : {}) }
    }
    payload = event.to_json

    # Stub Stripe signature verification to accept our test payload
    allow(Stripe::Webhook).to receive(:construct_event)
      .and_return(Stripe::Event.construct_from(event))

    post "/api/webhooks/stripe",
         params: payload,
         headers: {
           "CONTENT_TYPE" => "application/json",
           "HTTP_STRIPE_SIGNATURE" => "t=#{Time.now.to_i},v1=fakesig"
         }
  end

  describe "checkout.session.completed" do
    let(:user) { create(:user) }
    let(:plan) { create(:plan) }

    it "creates a subscription for the user" do
      stripe_sub = OpenStruct.new(
        id: "sub_new123",
        status: "active",
        current_period_start: Time.current.to_i,
        current_period_end: 1.month.from_now.to_i
      )
      allow(Stripe::Subscription).to receive(:retrieve).and_return(stripe_sub)

      expect {
        post_webhook("checkout.session.completed", {
          subscription: "sub_new123",
          customer: "cus_abc123"
        }, metadata: { user_id: user.id.to_s, plan_id: plan.id.to_s })
      }.to change(Subscription, :count).by(1)

      expect(response).to have_http_status(:ok)
      sub = Subscription.last
      expect(sub.user).to eq(user)
      expect(sub.plan).to eq(plan)
      expect(sub.stripe_subscription_id).to eq("sub_new123")
      expect(sub.status).to eq("active")
    end

    it "ignores event when user_id or plan_id missing" do
      expect {
        post_webhook("checkout.session.completed", {
          subscription: "sub_orphan",
          customer: "cus_orphan"
        })
      }.not_to change(Subscription, :count)

      expect(response).to have_http_status(:ok)
    end
  end

  describe "customer.subscription.updated" do
    let(:user) { create(:user) }
    let(:plan) { create(:plan) }
    let!(:subscription) do
      create(:subscription,
        user: user, plan: plan,
        stripe_subscription_id: "sub_update123",
        status: "active")
    end

    it "updates subscription status and period" do
      new_period_end = 2.months.from_now.to_i
      post_webhook("customer.subscription.updated", {
        id: "sub_update123",
        status: "past_due",
        current_period_start: Time.current.to_i,
        current_period_end: new_period_end,
        cancel_at: nil,
        canceled_at: nil,
        items: { data: [{ price: { id: plan.stripe_price_id } }] }
      })

      expect(response).to have_http_status(:ok)
      subscription.reload
      expect(subscription.status).to eq("past_due")
    end

    it "updates plan when price changes" do
      new_plan = create(:plan)
      post_webhook("customer.subscription.updated", {
        id: "sub_update123",
        status: "active",
        current_period_start: Time.current.to_i,
        current_period_end: 1.month.from_now.to_i,
        cancel_at: nil,
        canceled_at: nil,
        items: { data: [{ price: { id: new_plan.stripe_price_id } }] }
      })

      expect(subscription.reload.plan).to eq(new_plan)
    end
  end

  describe "customer.subscription.deleted" do
    let(:user) { create(:user) }
    let(:plan) { create(:plan) }
    let!(:subscription) do
      create(:subscription,
        user: user, plan: plan,
        stripe_subscription_id: "sub_delete123",
        status: "active")
    end

    it "marks subscription as canceled" do
      post_webhook("customer.subscription.deleted", { id: "sub_delete123" })

      expect(response).to have_http_status(:ok)
      subscription.reload
      expect(subscription.status).to eq("canceled")
      expect(subscription.canceled_at).to be_present
    end

    it "handles missing subscription gracefully" do
      post_webhook("customer.subscription.deleted", { id: "sub_nonexistent" })
      expect(response).to have_http_status(:ok)
    end
  end

  describe "invoice.payment_failed" do
    let(:user) { create(:user) }
    let(:plan) { create(:plan) }
    let!(:subscription) do
      create(:subscription,
        user: user, plan: plan,
        stripe_subscription_id: "sub_fail123",
        status: "active")
    end

    it "marks subscription as past_due" do
      post_webhook("invoice.payment_failed", { subscription: "sub_fail123" })

      expect(response).to have_http_status(:ok)
      expect(subscription.reload.status).to eq("past_due")
    end

    it "handles missing subscription gracefully" do
      post_webhook("invoice.payment_failed", { subscription: "sub_unknown" })
      expect(response).to have_http_status(:ok)
    end
  end

  describe "signature verification" do
    it "returns 400 on invalid signature" do
      allow(Stripe::Webhook).to receive(:construct_event)
        .and_raise(Stripe::SignatureVerificationError.new("bad sig", "sig_header"))

      post "/api/webhooks/stripe",
           params: "{}",
           headers: {
             "CONTENT_TYPE" => "application/json",
             "HTTP_STRIPE_SIGNATURE" => "invalid"
           }

      expect(response).to have_http_status(:bad_request)
    end
  end
end
