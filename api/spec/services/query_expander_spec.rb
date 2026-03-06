# frozen_string_literal: true

require "rails_helper"

RSpec.describe QueryExpander do
  subject(:expander) { described_class.new }

  describe "#expand" do
    context "when query is blank" do
      it "returns empty result with skipped: true" do
        result = expander.expand("")
        expect(result[:skipped]).to be true
        expect(result[:lex]).to eq([])
        expect(result[:vec]).to eq([])
        expect(result[:hyde]).to eq([])
      end
    end

    context "when BM25 probe detects strong match" do
      let(:query) { "reset password" }

      before do
        # Mock a strong BM25 match: top score >= 5.0 with gap >= 2.0
        mock_relation = double("relation")
        allow(ArticleChunk).to receive(:where).and_return(mock_relation)
        allow(mock_relation).to receive(:select).and_return(mock_relation)
        allow(mock_relation).to receive(:order).and_return(mock_relation)
        allow(mock_relation).to receive(:limit).and_return([
          double(id: 1, "[]": ->(_) { 6.0 }),
          double(id: 2, "[]": ->(_) { 3.5 })
        ])

        strong_results = [
          double(id: 1, "[]" => 6.0),
          double(id: 2, "[]" => 3.5)
        ]
        allow(strong_results[0]).to receive(:[]).with(:rank_score).and_return(6.0)
        allow(strong_results[1]).to receive(:[]).with(:rank_score).and_return(3.5)
        allow(mock_relation).to receive(:limit).with(2).and_return(strong_results)
      end

      it "skips LLM expansion" do
        result = expander.expand(query)
        expect(result[:skipped]).to be true
        expect(result[:original]).to eq(query)
      end
    end

    context "when BM25 probe does not find strong match" do
      let(:query) { "how do I configure webhooks?" }
      let(:llm_response) do
        {
          "lex" => ["webhook configuration", "setup webhooks"],
          "vec" => ["configuring webhook endpoints for event notifications"],
          "hyde" => ["To configure webhooks, navigate to Settings > Integrations..."]
        }.to_json
      end

      before do
        # Mock weak BM25 results
        mock_relation = double("relation")
        allow(ArticleChunk).to receive(:where).and_return(mock_relation)
        allow(mock_relation).to receive(:select).and_return(mock_relation)
        allow(mock_relation).to receive(:order).and_return(mock_relation)
        allow(mock_relation).to receive(:limit).with(2).and_return([])

        # Mock RubyLLM chat
        mock_chat = double("chat")
        mock_response = double("response", content: llm_response)
        allow(RubyLLM).to receive(:chat).and_return(mock_chat)
        allow(mock_chat).to receive(:ask).and_return(mock_response)
      end

      it "returns expanded queries from LLM" do
        result = expander.expand(query)

        expect(result[:skipped]).to be false
        expect(result[:original]).to eq(query)
        expect(result[:lex]).to eq(["webhook configuration", "setup webhooks"])
        expect(result[:vec]).to eq(["configuring webhook endpoints for event notifications"])
        expect(result[:hyde]).to eq(["To configure webhooks, navigate to Settings > Integrations..."])
      end
    end

    context "when LLM call fails" do
      let(:query) { "test query" }

      before do
        mock_relation = double("relation")
        allow(ArticleChunk).to receive(:where).and_return(mock_relation)
        allow(mock_relation).to receive(:select).and_return(mock_relation)
        allow(mock_relation).to receive(:order).and_return(mock_relation)
        allow(mock_relation).to receive(:limit).with(2).and_return([])

        allow(RubyLLM).to receive(:chat).and_raise(StandardError, "API timeout")
      end

      it "falls back to empty result with skipped: true" do
        result = expander.expand(query)
        expect(result[:skipped]).to be true
        expect(result[:lex]).to eq([])
      end
    end

    context "when LLM returns malformed JSON" do
      let(:query) { "test query" }

      before do
        mock_relation = double("relation")
        allow(ArticleChunk).to receive(:where).and_return(mock_relation)
        allow(mock_relation).to receive(:select).and_return(mock_relation)
        allow(mock_relation).to receive(:order).and_return(mock_relation)
        allow(mock_relation).to receive(:limit).with(2).and_return([])

        mock_chat = double("chat")
        mock_response = double("response", content: "not valid json at all")
        allow(RubyLLM).to receive(:chat).and_return(mock_chat)
        allow(mock_chat).to receive(:ask).and_return(mock_response)
      end

      it "falls back gracefully" do
        result = expander.expand(query)
        expect(result[:skipped]).to be true
      end
    end
  end
end
