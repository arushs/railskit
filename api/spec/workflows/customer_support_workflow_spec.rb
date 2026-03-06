# frozen_string_literal: true

require "rails_helper"

RSpec.describe CustomerSupportWorkflow do
  let(:mock_response) { OpenStruct.new(content: "I can help you with that refund.") }

  let(:mock_agent) do
    agent = double("agent")
    allow(agent).to receive(:ask).and_return(mock_response)
    agent
  end

  before do
    AgentRouter.reset!
    AgentRouter.register(HelpDeskAgent, capabilities: %w[support help ticket faq])
    AgentRouter.register(BillingAgent, capabilities: %w[billing payment refund invoice])

    # Stub agent instantiation to avoid LLM calls
    allow(BillingAgent).to receive(:new).and_return(mock_agent)
    allow(HelpDeskAgent).to receive(:new).and_return(mock_agent)
  end

  describe ".run" do
    it "routes a billing message through all steps" do
      result = described_class.run(message: "I want a refund", conversation: nil)

      expect(result[:_steps_executed]).to include(:triage, :route, :quality_check, :respond)
      expect(result[:routed_to]).to eq("BillingAgent")
      expect(result[:final_response]).to be_present
      expect(result[:_errors]).to be_empty
    end

    it "routes a support message to HelpDeskAgent" do
      result = described_class.run(message: "I need help with my ticket", conversation: nil)

      expect(result[:routed_to]).to eq("HelpDeskAgent")
      expect(result[:final_response]).to be_present
    end

    it "falls back to HelpDeskAgent for unclassified messages" do
      result = described_class.run(message: "asdf random", conversation: nil)

      expect(result[:routed_to]).to eq("HelpDeskAgent")
    end

    it "triggers fallback when agent returns empty response" do
      empty_agent = double("empty_agent")
      allow(empty_agent).to receive(:ask).and_return(OpenStruct.new(content: ""))
      allow(BillingAgent).to receive(:new).and_return(empty_agent)
      # HelpDeskAgent is the fallback
      allow(HelpDeskAgent).to receive(:new).and_return(mock_agent)

      result = described_class.run(message: "refund", conversation: nil)

      expect(result[:needs_fallback]).to be true
      expect(result[:_steps_executed]).to include(:fallback)
      expect(result[:final_response]).to eq("I can help you with that refund.")
    end

    it "includes metadata in the final response" do
      result = described_class.run(message: "refund", conversation: nil)

      expect(result[:metadata]).to include(
        routed_to: anything,
        quality: :ok,
        steps: anything
      )
    end
  end
end
