# frozen_string_literal: true

require "rails_helper"

RSpec.describe Rag::QueryExpander do
  let(:mock_chat) { instance_double("RubyLLM::Chat") }
  let(:mock_response) { instance_double("RubyLLM::Response", content: "expanded query text") }

  before do
    allow(RubyLLM).to receive(:chat).and_return(mock_chat)
    allow(mock_chat).to receive(:ask).and_return(mock_response)
  end

  describe ".expand" do
    it "raises on unknown strategy" do
      expect { described_class.expand("test", strategy: :unknown) }.to raise_error(ArgumentError, /Unknown strategy/)
    end

    it "returns original query for blank input" do
      result = described_class.expand("", strategy: :hyde)
      expect(result.text).to eq("")
      expect(result.original).to eq("")
      expect(result.strategy).to eq(:hyde)
    end

    context "with :lexical strategy" do
      it "calls LLM with synonym expansion prompt" do
        expect(mock_chat).to receive(:ask).with(a_string_matching(/synonyms.*related terms/m)).and_return(mock_response)

        result = described_class.expand("reset password", strategy: :lexical)
        expect(result.text).to eq("expanded query text")
        expect(result.strategy).to eq(:lexical)
        expect(result.original).to eq("reset password")
      end
    end

    context "with :vector strategy" do
      it "calls LLM with rephrasing prompt" do
        expect(mock_chat).to receive(:ask).with(a_string_matching(/Rephrase.*semantic similarity/m)).and_return(mock_response)

        result = described_class.expand("billing help", strategy: :vector)
        expect(result.text).to eq("expanded query text")
        expect(result.strategy).to eq(:vector)
      end
    end

    context "with :hyde strategy" do
      it "calls LLM with hypothetical document prompt" do
        allow(mock_response).to receive(:content).and_return("To reset your password, go to Settings > Security > Change Password.")

        expect(mock_chat).to receive(:ask).with(a_string_matching(/ideal answer.*document retrieval/m)).and_return(mock_response)

        result = described_class.expand("How do I reset my password?", strategy: :hyde)
        expect(result.text).to include("reset your password")
        expect(result.strategy).to eq(:hyde)
        expect(result.original).to eq("How do I reset my password?")
      end
    end

    context "LLM failure fallback" do
      before do
        allow(mock_chat).to receive(:ask).and_raise(StandardError, "API timeout")
      end

      it "falls back to original query on error" do
        result = described_class.expand("test query", strategy: :hyde)
        expect(result.text).to eq("test query")
        expect(result.strategy).to eq(:hyde)
        expect(result.original).to eq("test query")
      end

      it "logs a warning" do
        expect(Rails.logger).to receive(:warn).with(a_string_matching(/LLM call failed.*API timeout/))
        described_class.expand("test query", strategy: :hyde)
      end
    end

    context "model configuration" do
      it "uses rag.expansion_model from config when set" do
        config = RailsKit::ConfigNode.new({
          rag: { expansion_model: "gpt-4o" },
          ai: { model: "claude-3.5-sonnet" }
        })
        allow(RailsKit).to receive(:config).and_return(config)

        expect(RubyLLM).to receive(:chat).with(model: "gpt-4o").and_return(mock_chat)
        described_class.expand("test", strategy: :vector)
      end

      it "falls back to ai.model when expansion_model not set" do
        config = RailsKit::ConfigNode.new({
          rag: {},
          ai: { model: "claude-3.5-sonnet" }
        })
        allow(RailsKit).to receive(:config).and_return(config)

        expect(RubyLLM).to receive(:chat).with(model: "claude-3.5-sonnet").and_return(mock_chat)
        described_class.expand("test", strategy: :vector)
      end

      it "defaults to gpt-4o-mini when no config" do
        config = RailsKit::ConfigNode.new({})
        allow(RailsKit).to receive(:config).and_return(config)

        expect(RubyLLM).to receive(:chat).with(model: "gpt-4o-mini").and_return(mock_chat)
        described_class.expand("test", strategy: :vector)
      end
    end
  end

  describe ".expand_multi" do
    it "returns results for all requested strategies" do
      results = described_class.expand_multi("test query", strategies: [:lexical, :vector, :hyde])
      expect(results.length).to eq(3)
      expect(results.map(&:strategy)).to eq([:lexical, :vector, :hyde])
      results.each do |r|
        expect(r.original).to eq("test query")
      end
    end

    it "defaults to vector + hyde strategies" do
      results = described_class.expand_multi("test")
      expect(results.length).to eq(2)
      expect(results.map(&:strategy)).to eq([:vector, :hyde])
    end
  end

  describe "Result" do
    it "is a Data class with expected fields" do
      result = described_class::Result.new(text: "expanded", strategy: :hyde, original: "original")
      expect(result.text).to eq("expanded")
      expect(result.strategy).to eq(:hyde)
      expect(result.original).to eq("original")
    end
  end
end
