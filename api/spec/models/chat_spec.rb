# frozen_string_literal: true

require "rails_helper"

RSpec.describe Chat do
  subject(:chat) { build(:chat) }

  describe "validations" do
    it { is_expected.to validate_presence_of(:agent_class) }
  end

  describe "associations" do
    it { is_expected.to have_many(:messages).dependent(:destroy) }
  end

  describe "token tracking (ActsAsChat)" do
    let(:chat) { create(:chat) }

    before do
      create(:message, chat: chat, input_tokens: 100, output_tokens: 50)
      create(:message, chat: chat, input_tokens: 200, output_tokens: 75)
    end

    it "#total_tokens sums all tokens" do
      expect(chat.total_tokens).to eq(425)
    end

    it "#total_input_tokens sums input tokens" do
      expect(chat.total_input_tokens).to eq(300)
    end

    it "#total_output_tokens sums output tokens" do
      expect(chat.total_output_tokens).to eq(125)
    end
  end

  describe "#persist_message" do
    let(:chat) { create(:chat) }

    it "creates a message with the given attributes" do
      chat.persist_message(role: "user", content: "Hello")
      expect(chat.messages.count).to eq(1)
      expect(chat.messages.first.role).to eq("user")
      expect(chat.messages.first.content).to eq("Hello")
    end
  end
end
