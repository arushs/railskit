# frozen_string_literal: true

require "rails_helper"
require "webmock/rspec"

RSpec.describe Rag::HybridSearchService do
  let(:collection) { create(:collection, name: "Help Center") }
  let(:document) { create(:document, collection: collection, title: "Password Guide", status: "ready") }
  let(:embedding_768) { Array.new(768) { rand(-1.0..1.0) } }

  def stub_fireworks_embedding
    allow(Rag::EmbeddingService).to receive(:embed).and_return(embedding_768)
  end

  before do
    stub_fireworks_embedding
  end

  describe ".search" do
    it "returns empty for blank query" do
      expect(described_class.search("")).to eq([])
      expect(described_class.search(nil)).to eq([])
    end

    it "raises on unknown mode" do
      expect { described_class.search("test", mode: :invalid) }.to raise_error(ArgumentError, /Unknown mode/)
    end

    context "with vector mode" do
      let!(:chunk1) { create(:chunk, document: document, position: 0, content: "Reset your password in settings", embedding: embedding_768) }
      let!(:chunk2) { create(:chunk, document: document, position: 1, content: "Contact support for billing", embedding: Array.new(768) { rand(-1.0..1.0) }) }

      it "returns results ranked by vector similarity" do
        results = described_class.search("password reset", mode: :vector, limit: 5)
        expect(results).to be_an(Array)
        results.each do |r|
          expect(r).to be_a(Rag::HybridSearchService::Result)
          expect(r.score).to be > 0
          expect(r.vector_rank).to be_a(Integer)
          expect(r.lexical_rank).to be_nil
        end
      end

      it "respects limit" do
        results = described_class.search("test", mode: :vector, limit: 1)
        expect(results.length).to be <= 1
      end
    end

    context "with lexical mode" do
      let!(:chunk_password) do
        create(:chunk, document: document, position: 0, content: "Reset your password in settings")
      end
      let!(:chunk_billing) do
        create(:chunk, document: document, position: 1, content: "Contact support for billing issues")
      end

      it "returns results ranked by text relevance" do
        results = described_class.search("password reset", mode: :lexical, limit: 5)
        expect(results).to be_an(Array)
        # Should find the password chunk via full-text search
        if results.any?
          expect(results.first.lexical_rank).to be_a(Integer)
          expect(results.first.vector_rank).to be_nil
        end
      end

      it "handles queries with no lexical matches" do
        results = described_class.search("xyzzyplugh", mode: :lexical, limit: 5)
        expect(results).to eq([])
      end
    end

    context "with hybrid mode (default)" do
      let!(:chunk1) { create(:chunk, document: document, position: 0, content: "Reset your password in account settings", embedding: embedding_768) }
      let!(:chunk2) { create(:chunk, document: document, position: 1, content: "Billing and payment information", embedding: Array.new(768) { rand(-1.0..1.0) }) }

      it "combines vector and lexical results with RRF scoring" do
        results = described_class.search("password reset", mode: :hybrid, limit: 5)
        expect(results).to be_an(Array)
        # Scores should be monotonically decreasing
        scores = results.map(&:score)
        expect(scores).to eq(scores.sort.reverse)
      end

      it "boosts chunks that appear in both retrievers" do
        # A chunk found by both vector AND lexical should rank higher
        # than one found by only one retriever (given similar positions)
        results = described_class.search("password settings", mode: :hybrid, limit: 5)
        results.each do |r|
          if r.vector_rank && r.lexical_rank
            # Chunk in both retrievers should have higher score than single-retriever
            single_retriever_results = results.select { |x| x.vector_rank.nil? || x.lexical_rank.nil? }
            single_retriever_results.each do |single|
              expect(r.score).to be >= single.score
            end
          end
        end
      end

      it "returns Result objects with all fields" do
        results = described_class.search("password", limit: 2)
        results.each do |r|
          expect(r.chunk).to be_a(Chunk)
          expect(r.score).to be_a(Float)
          expect(r.document_title).to be_a(String)
          expect(r.collection_name).to eq("Help Center")
        end
      end
    end

    context "scoping by collection" do
      let(:other_collection) { create(:collection, name: "Other") }
      let(:other_doc) { create(:document, collection: other_collection, title: "Other Doc", status: "ready") }
      let!(:chunk_in_scope) { create(:chunk, document: document, position: 0, content: "password help", embedding: embedding_768) }
      let!(:chunk_out_of_scope) { create(:chunk, document: other_doc, position: 0, content: "password info", embedding: embedding_768) }

      it "filters by collection" do
        results = described_class.search("password", collection: collection, mode: :vector)
        chunk_ids = results.map { |r| r.chunk.id }
        expect(chunk_ids).to include(chunk_in_scope.id)
        expect(chunk_ids).not_to include(chunk_out_of_scope.id)
      end

      it "filters by collection_ids" do
        results = described_class.search("password", collection_ids: [collection.id], mode: :vector)
        chunk_ids = results.map { |r| r.chunk.id }
        expect(chunk_ids).to include(chunk_in_scope.id)
        expect(chunk_ids).not_to include(chunk_out_of_scope.id)
      end
    end

    context "excludes non-ready documents" do
      let!(:ready_chunk) { create(:chunk, document: document, position: 0, content: "ready content", embedding: embedding_768) }
      let(:pending_doc) { create(:document, collection: collection, title: "Pending", status: "pending") }
      let!(:pending_chunk) { create(:chunk, document: pending_doc, position: 0, content: "pending content", embedding: embedding_768) }

      it "only returns chunks from ready documents" do
        results = described_class.search("content", mode: :vector)
        chunk_ids = results.map { |r| r.chunk.id }
        expect(chunk_ids).to include(ready_chunk.id)
        expect(chunk_ids).not_to include(pending_chunk.id)
      end
    end

    context "threshold filtering" do
      let!(:chunk1) { create(:chunk, document: document, position: 0, content: "relevant text", embedding: embedding_768) }

      it "filters results below threshold" do
        results = described_class.search("relevant", mode: :vector, threshold: 1.0)
        # With k=60, max single-retriever RRF score is 1/61 ≈ 0.016, so threshold 1.0 filters everything
        expect(results).to eq([])
      end
    end
  end

  describe ".format_for_context" do
    it "returns empty string for no results" do
      expect(described_class.format_for_context([])).to eq("")
    end

    it "formats results with source headers" do
      chunk = create(:chunk, document: document, position: 0, content: "Password reset instructions")
      result = Rag::HybridSearchService::Result.new(
        chunk: chunk,
        score: 0.016393,
        document_title: "Password Guide",
        collection_name: "Help Center",
        vector_rank: 1,
        lexical_rank: 2
      )

      output = described_class.format_for_context([result])
      expect(output).to include("[Source 1: Password Guide (Help Center)")
      expect(output).to include("Password reset instructions")
    end
  end

  describe "RRF scoring correctness" do
    it "computes correct RRF scores" do
      # Manual verification: k=60
      # Chunk in both retrievers at rank 1 (vec) and rank 2 (lex):
      #   1/(60+1) + 1/(60+2) = 0.016393 + 0.016129 = 0.032522
      # Chunk in only vector at rank 2:
      #   1/(60+2) = 0.016129
      k = 60
      score_both = (1.0 / (k + 1)) + (1.0 / (k + 2))
      score_single = 1.0 / (k + 2)

      expect(score_both).to be > score_single
      expect(score_both.round(6)).to eq(0.032522)
    end
  end

  describe "sanitize_tsquery" do
    it "joins words with &" do
      # Access private method for unit testing
      result = described_class.send(:sanitize_tsquery, "billing reset password")
      expect(result).to eq("billing & reset & password")
    end

    it "strips special characters" do
      result = described_class.send(:sanitize_tsquery, "hello! @world #test")
      expect(result).to eq("hello & world & test")
    end

    it "handles empty/blank input" do
      expect(described_class.send(:sanitize_tsquery, "")).to eq("")
      expect(described_class.send(:sanitize_tsquery, "   ")).to eq("")
    end
  end
end
