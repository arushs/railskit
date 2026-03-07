# frozen_string_literal: true

require "rails_helper"

RSpec.describe DocumentClassifierAgent do
  let(:categories) do
    [
      { name: "invoice", description: "An invoice or bill", examples: ["Invoice #123"] },
      { name: "contract", description: "A legal contract", examples: ["Agreement between"] }
    ]
  end

  let(:llm_response) do
    double("response", content: '{"classification": "invoice", "confidence": 0.95, "reasoning": "Contains invoice number and amounts"}')
  end

  let(:chat) { double("chat", with_instructions: nil, ask: llm_response) }

  before do
    allow(RubyLLM).to receive(:chat).and_return(chat)
  end

  describe "#classify" do
    it "returns classification with confidence and reasoning" do
      agent = described_class.new
      result = agent.classify(text: "Invoice #12345\nTotal: $500.00", categories: categories)

      expect(result[:classification]).to eq("invoice")
      expect(result[:confidence]).to eq(0.95)
      expect(result[:reasoning]).to include("invoice")
    end

    it "clamps confidence to 0-1 range" do
      bad_response = double("response", content: '{"classification": "invoice", "confidence": 1.5, "reasoning": "test"}')
      allow(chat).to receive(:ask).and_return(bad_response)

      agent = described_class.new
      result = agent.classify(text: "test", categories: categories)

      expect(result[:confidence]).to eq(1.0)
    end

    it "clamps negative confidence to 0" do
      bad_response = double("response", content: '{"classification": "invoice", "confidence": -0.5, "reasoning": "test"}')
      allow(chat).to receive(:ask).and_return(bad_response)

      agent = described_class.new
      result = agent.classify(text: "test", categories: categories)

      expect(result[:confidence]).to eq(0.0)
    end

    it "validates classification against provided categories" do
      bad_response = double("response", content: '{"classification": "unknown_type", "confidence": 0.5, "reasoning": "test"}')
      allow(chat).to receive(:ask).and_return(bad_response)

      agent = described_class.new
      result = agent.classify(text: "test", categories: categories)

      expect(result[:classification]).to eq("invoice") # falls back to first category
    end

    it "handles JSON parse errors gracefully" do
      bad_response = double("response", content: "not valid json at all")
      allow(chat).to receive(:ask).and_return(bad_response)

      agent = described_class.new
      result = agent.classify(text: "test", categories: categories)

      expect(result[:classification]).to eq("invoice")
      expect(result[:confidence]).to eq(0.0)
      expect(result[:reasoning]).to include("Failed to parse")
    end

    it "strips markdown fencing from response" do
      fenced_response = double("response", content: "```json\n{\"classification\": \"contract\", \"confidence\": 0.88, \"reasoning\": \"Legal terms\"}\n```")
      allow(chat).to receive(:ask).and_return(fenced_response)

      agent = described_class.new
      result = agent.classify(text: "Agreement between Party A and Party B", categories: categories)

      expect(result[:classification]).to eq("contract")
      expect(result[:confidence]).to eq(0.88)
    end

    it "raises on blank text" do
      agent = described_class.new
      expect { agent.classify(text: "", categories: categories) }.to raise_error(ArgumentError)
    end

    it "raises on blank categories" do
      agent = described_class.new
      expect { agent.classify(text: "test", categories: []) }.to raise_error(ArgumentError)
    end
  end

  describe "#ask" do
    it "uses default categories when called via ask" do
      agent = described_class.new
      expect(chat).to receive(:ask).and_return(llm_response)
      result = agent.ask("Some document text")
      expect(result).to have_key(:classification)
    end
  end

  describe "AsTool integration" do
    it "can be converted to a tool" do
      tool_class = described_class.to_tool
      expect(tool_class.ancestors).to include(RubyLLM::Tool)
    end
  end
end
