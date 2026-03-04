# frozen_string_literal: true

require "rails_helper"

RSpec.describe Subscription do
  subject(:subscription) { build(:subscription) }

  # -- Validations --
  describe "validations" do
    it { is_expected.to validate_presence_of(:stripe_subscription_id) }
    it { is_expected.to validate_uniqueness_of(:stripe_subscription_id) }
    it { is_expected.to validate_presence_of(:stripe_customer_id) }
    it { is_expected.to validate_presence_of(:status) }
  end

  # -- Associations --
  describe "associations" do
    it { is_expected.to belong_to(:user) }
    it { is_expected.to belong_to(:plan) }
  end

  # -- Scopes --
  describe "scopes" do
    let(:user) { create(:user) }
    let(:plan) { create(:plan) }

    describe ".active" do
      it "includes active and trialing subscriptions" do
        active = create(:subscription, user: user, plan: plan, status: "active")
        trialing = create(:subscription, user: user, plan: plan, status: "trialing")
        canceled = create(:subscription, :canceled, user: user, plan: plan)

        result = described_class.active
        expect(result).to include(active, trialing)
        expect(result).not_to include(canceled)
      end
    end

    describe ".by_customer" do
      it "filters by stripe_customer_id" do
        sub = create(:subscription, user: user, plan: plan, stripe_customer_id: "cus_target")
        create(:subscription, user: user, plan: plan, stripe_customer_id: "cus_other")

        expect(described_class.by_customer("cus_target")).to eq([sub])
      end
    end
  end

  # -- Instance methods --
  describe "#active?" do
    it "returns true for active status" do
      subscription.status = "active"
      expect(subscription.active?).to be true
    end

    it "returns true for trialing status" do
      subscription.status = "trialing"
      expect(subscription.active?).to be true
    end

    it "returns false for canceled status" do
      subscription.status = "canceled"
      expect(subscription.active?).to be false
    end
  end

  describe "#canceled?" do
    it "returns true when status is canceled" do
      subscription.status = "canceled"
      expect(subscription.canceled?).to be true
    end
  end

  describe "#past_due?" do
    it "returns true when status is past_due" do
      subscription.status = "past_due"
      expect(subscription.past_due?).to be true
    end
  end

  describe "#feature?" do
    it "delegates to plan" do
      plan = build(:plan, features: { "api_access" => true })
      subscription = build(:subscription, plan: plan)
      expect(subscription.feature?(:api_access)).to be true
    end
  end
end
