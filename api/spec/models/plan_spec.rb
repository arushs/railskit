# frozen_string_literal: true

require "rails_helper"

RSpec.describe Plan do
  subject(:plan) { build(:plan) }

  # -- Validations --
  describe "validations" do
    it { is_expected.to validate_presence_of(:name) }
    it { is_expected.to validate_presence_of(:slug) }
    it { is_expected.to validate_uniqueness_of(:slug) }
    it { is_expected.to validate_presence_of(:stripe_price_id) }
    it { is_expected.to validate_uniqueness_of(:stripe_price_id) }
    it { is_expected.to validate_inclusion_of(:interval).in_array(%w[month year]) }
    it { is_expected.to validate_numericality_of(:amount_cents).is_greater_than_or_equal_to(0) }
  end

  # -- Associations --
  describe "associations" do
    it { is_expected.to have_many(:subscriptions).dependent(:restrict_with_error) }
  end

  # -- Scopes --
  describe "scopes" do
    let!(:active_plan) { create(:plan, active: true) }
    let!(:inactive_plan) { create(:plan, :inactive) }

    describe ".active" do
      it "returns only active plans" do
        expect(described_class.active).to include(active_plan)
        expect(described_class.active).not_to include(inactive_plan)
      end
    end

    describe ".ordered" do
      it "orders by sort_order then amount_cents" do
        cheap = create(:plan, sort_order: 1, amount_cents: 100)
        expensive = create(:plan, sort_order: 1, amount_cents: 500)
        first = create(:plan, sort_order: 0, amount_cents: 200)
        expect(described_class.ordered.to_a).to start_with(first)
      end
    end
  end

  # -- Instance methods --
  describe "#free?" do
    it "returns true for zero amount" do
      plan = build(:plan, :free)
      expect(plan.free?).to be true
    end

    it "returns false for non-zero amount" do
      expect(plan.free?).to be false
    end
  end

  describe "#display_price" do
    it "returns 'Free' for free plans" do
      plan = build(:plan, :free)
      expect(plan.display_price).to eq("Free")
    end

    it "returns formatted price with interval" do
      plan = build(:plan, amount_cents: 2900, interval: "month")
      expect(plan.display_price).to eq("$29.0/month")
    end
  end

  describe "#feature?" do
    it "returns true when feature is enabled" do
      plan = build(:plan, features: { "api_access" => true })
      expect(plan.feature?(:api_access)).to be true
    end

    it "returns false when feature is missing" do
      plan = build(:plan, features: {})
      expect(plan.feature?(:api_access)).to be false
    end
  end

  describe "#feature_value" do
    it "returns the feature value" do
      plan = build(:plan, features: { "max_agents" => 5 })
      expect(plan.feature_value(:max_agents)).to eq(5)
    end

    it "returns nil for missing features" do
      plan = build(:plan, features: {})
      expect(plan.feature_value(:max_agents)).to be_nil
    end
  end
end
