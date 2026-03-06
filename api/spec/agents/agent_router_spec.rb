# frozen_string_literal: true

require "rails_helper"

RSpec.describe AgentRouter do
  # Minimal stub agents for testing
  let(:billing_agent_class) do
    Class.new do
      def self.name = "BillingAgent"
      def initialize(**) = nil
      def ask(msg) = OpenStruct.new(content: "billing: #{msg}")
    end
  end

  let(:support_agent_class) do
    Class.new do
      def self.name = "SupportAgent"
      def initialize(**) = nil
      def ask(msg) = OpenStruct.new(content: "support: #{msg}")
    end
  end

  before { described_class.reset! }

  describe ".register" do
    it "adds agents to the registry" do
      described_class.register(billing_agent_class, capabilities: %w[billing invoices])
      expect(described_class.registry.size).to eq(1)
      expect(described_class.registry.first.agent_class).to eq(billing_agent_class)
    end
  end

  describe ".route" do
    before do
      described_class.register(billing_agent_class, capabilities: %w[billing invoices refund payment])
      described_class.register(support_agent_class, capabilities: %w[support help ticket faq])
    end

    it "routes billing messages to the billing agent" do
      expect(described_class.route("I need a refund")).to eq(billing_agent_class)
    end

    it "routes support messages to the support agent" do
      expect(described_class.route("I need help with my ticket")).to eq(support_agent_class)
    end

    it "returns nil when no capabilities match" do
      expect(described_class.route("xyz abc")).to be_nil
    end

    it "picks the agent with more keyword hits" do
      expect(described_class.route("billing invoice payment")).to eq(billing_agent_class)
    end
  end

  describe ".dispatch" do
    before do
      described_class.register(support_agent_class, capabilities: %w[support help])
    end

    it "returns an agent instance and class" do
      result = described_class.dispatch("I need help")
      expect(result[:agent_class]).to eq(support_agent_class)
      expect(result[:agent]).to be_a(support_agent_class)
    end

    it "falls back to first registered agent when no match" do
      result = described_class.dispatch("random gibberish that matches nothing", conversation: nil)
      expect(result[:agent_class]).to eq(support_agent_class)
    end
  end

  describe "priority" do
    it "breaks ties using priority" do
      described_class.register(billing_agent_class, capabilities: %w[account], priority: 5)
      described_class.register(support_agent_class, capabilities: %w[account], priority: 10)

      expect(described_class.route("account")).to eq(support_agent_class)
    end
  end
end
