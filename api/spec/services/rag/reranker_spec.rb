# frozen_string_literal: true

require "rails_helper"
require "webmock/rspec"

RSpec.describe Rag::Reranker do
  let(:collection) { create(:collection, name: "KB") }
  let(:document) { create(:document, collection: collection, title: "Guide", status: "ready") }
  let(:embedding) { Array.new(768) { 0.0 } }

  let!(:chunk0) { create(:chunk, document: document, position: 0, content: "First chunk about passwords", embedding: embedding) }
  let!(:chunk1) { create(:chunk, document: document, position: 1, content: "Second chunk about billing", embedding: embedding) }
  let!(:chunk2) { create(:chunk, document: document, position: 5, content: "Later chunk about settings", embedding: embedding) }

  let(:search_results) do
    [chunk0, chunk1, chunk2].map.with_index do |chunk, idx|
      Rag::HybridSearchService::Result.new(
        chunk: chunk,
        score: (0.8 - idx * 0.1).round(4),
        document_title: document.title,
        collection_name: collection.name,
        vector_rank: idx + 1,
        lexical_rank: nil
      )
    end
  end

  describe ".rerank" do
    it "returns empty for empty results" do
      expect(described_class.rerank("test", [])).to eq([])
    end

    it "returns empty for blank query" do
      expect(described_class.rerank("", search_results)).to eq([])
    end

    context "with passthrough (no reranker)" do
      it "returns results with blended scores" do
        results = described_class.rerank("test", search_results, limit: 3)
        expect(results.length).to eq(3)
        results.each do |r|
          expect(r).to be_a(described_class::Result)
          expect(r.score).to be > 0
          expect(r.rerank_score).to be >= 0
          expect(r.retrieval_score).to be >= 0
          expect(r.position_boost).to be > 0
        end
      end

      it "results are sorted by descending score" do
        results = described_class.rerank("test", search_results)
        scores = results.map(&:score)
        expect(scores).to eq(scores.sort.reverse)
      end

      it "respects limit" do
        results = described_class.rerank("test", search_results, limit: 1)
        expect(results.length).to eq(1)
      end
    end

    context "position-aware scoring" do
      it "gives position 0 chunks higher position_boost" do
        results = described_class.rerank("test", search_results, limit: 3)
        chunk0_result = results.find { |r| r.chunk.id == chunk0.id }
        chunk2_result = results.find { |r| r.chunk.id == chunk2.id }

        expect(chunk0_result.position_boost).to be > chunk2_result.position_boost
      end

      it "position boost follows 1/(1 + decay * pos) formula" do
        decay = 0.02
        results = described_class.rerank("test", search_results, position_decay: decay)

        chunk0_result = results.find { |r| r.chunk.id == chunk0.id }
        chunk2_result = results.find { |r| r.chunk.id == chunk2.id }

        expected_boost_0 = 1.0 / (1.0 + decay * 0) # position 0
        expected_boost_5 = 1.0 / (1.0 + decay * 5) # position 5

        expect(chunk0_result.position_boost).to eq(expected_boost_0.round(6))
        expect(chunk2_result.position_boost).to eq(expected_boost_5.round(6))
      end

      it "disables position bias with decay=0" do
        results = described_class.rerank("test", search_results, position_decay: 0.0)
        boosts = results.map(&:position_boost).uniq
        expect(boosts).to eq([1.0]) # all same
      end
    end

    context "score blending" do
      it "uses alpha to weight rerank vs retrieval scores" do
        # alpha=1.0 → pure rerank score (times position boost)
        results = described_class.rerank("test", search_results, alpha: 1.0, position_decay: 0.0)
        results.each do |r|
          expect(r.score).to eq(r.rerank_score.round(6))
        end

        # alpha=0.0 → pure retrieval score (times position boost)
        results = described_class.rerank("test", search_results, alpha: 0.0, position_decay: 0.0)
        results.each do |r|
          expect(r.score).to eq(r.retrieval_score.round(6))
        end
      end
    end

    context "chunked processing" do
      it "processes large result sets in chunks" do
        # Create 30 results
        many_chunks = (0...30).map do |i|
          c = create(:chunk, document: document, position: i + 10, content: "Chunk #{i}", embedding: embedding)
          Rag::HybridSearchService::Result.new(
            chunk: c, score: 0.5, document_title: "Guide",
            collection_name: "KB", vector_rank: i + 1, lexical_rank: nil
          )
        end

        results = described_class.rerank("test", many_chunks, limit: 10, chunk_size: 10)
        expect(results.length).to eq(10)
      end
    end

    context "with Fireworks reranker" do
      before do
        ENV["FIREWORKS_API_KEY"] = "test-key"
        config = RailsKit::ConfigNode.new({
          rag: { rerank_provider: "fireworks", rerank_model: "fireworks/qwen3-reranker-8b" }
        })
        allow(RailsKit).to receive(:config).and_return(config)
      end

      after do
        ENV.delete("FIREWORKS_API_KEY")
      end

      it "calls Fireworks rerank API" do
        stub_request(:post, "https://api.fireworks.ai/inference/v1/rerank")
          .to_return(
            status: 200,
            body: {
              results: [
                { index: 0, relevance_score: 0.95 },
                { index: 1, relevance_score: 0.3 },
                { index: 2, relevance_score: 0.7 }
              ]
            }.to_json,
            headers: { "Content-Type" => "application/json" }
          )

        results = described_class.rerank("password", search_results, limit: 3)
        expect(results.length).to eq(3)
        # Chunk with highest rerank score should be first (with alpha=0.7)
        expect(results.first.chunk.id).to eq(chunk0.id) # 0.95 rerank + 0.8 retrieval
      end

      it "raises on API error" do
        stub_request(:post, "https://api.fireworks.ai/inference/v1/rerank")
          .to_return(status: 500, body: { error: { message: "Server error" } }.to_json)

        expect { described_class.rerank("test", search_results) }.to raise_error(
          Rag::Reranker::Error, /Server error/
        )
      end
    end

    context "with Cohere reranker" do
      before do
        ENV["COHERE_API_KEY"] = "test-key"
        config = RailsKit::ConfigNode.new({
          rag: { rerank_provider: "cohere", rerank_model: "rerank-v3.5" }
        })
        allow(RailsKit).to receive(:config).and_return(config)
      end

      after do
        ENV.delete("COHERE_API_KEY")
      end

      it "calls Cohere rerank API" do
        stub_request(:post, "https://api.cohere.ai/v1/rerank")
          .to_return(
            status: 200,
            body: {
              results: [
                { index: 0, relevance_score: 0.9 },
                { index: 1, relevance_score: 0.4 },
                { index: 2, relevance_score: 0.6 }
              ]
            }.to_json,
            headers: { "Content-Type" => "application/json" }
          )

        results = described_class.rerank("billing", search_results, limit: 3)
        expect(results.length).to eq(3)
      end
    end
  end

  describe "Result data class" do
    it "has all expected fields" do
      r = described_class::Result.new(
        chunk: chunk0, score: 0.8, rerank_score: 0.9,
        retrieval_score: 0.7, position_boost: 1.0,
        document_title: "Test", collection_name: "KB"
      )
      expect(r.chunk).to eq(chunk0)
      expect(r.score).to eq(0.8)
      expect(r.rerank_score).to eq(0.9)
      expect(r.retrieval_score).to eq(0.7)
      expect(r.position_boost).to eq(1.0)
    end
  end
end
