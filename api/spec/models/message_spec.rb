# frozen_string_literal: true

require "rails_helper"

RSpec.describe Message do
  subject(:message) { build(:message) }

  describe "validations" do
    it { is_expected.to validate_presence_of(:role) }
    it { is_expected.to validate_inclusion_of(:role).in_array(%w[system user assistant tool]) }
  end

  describe "associations" do
    it { is_expected.to belong_to(:chat) }
  end

  describe "scopes" do
    let(:chat) { create(:chat) }

    describe ".by_role" do
      it "filters by role" do
        user_msg = create(:message, chat: chat, role: "user")
        create(:message, :assistant, chat: chat)
        expect(described_class.by_role("user")).to eq([user_msg])
      end
    end

    describe ".recent" do
      it "returns the N most recent messages" do
        15.times { |i| create(:message, chat: chat, created_at: i.minutes.ago) }
        expect(described_class.recent(5).count).to eq(5)
      end
    end
  end

  describe "#total_tokens" do
    it "sums input and output tokens" do
      message = build(:message, input_tokens: 100, output_tokens: 50)
      expect(message.total_tokens).to eq(150)
    end

    it "handles nil tokens" do
      message = build(:message, input_tokens: nil, output_tokens: nil)
      expect(message.total_tokens).to eq(0)
    end
  end
end
