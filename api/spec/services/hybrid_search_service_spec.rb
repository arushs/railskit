# frozen_string_literal: true

require "rails_helper"

RSpec.describe HybridSearchService do
  let(:service) { described_class.new }

  describe "#reciprocal_rank_fusion" do
    it "computes RRF scores correctly for a single list" do
      ranked_lists = [[1, 2, 3]]
      results = service.reciprocal_rank_fusion(ranked_lists)

      # With k=60: rank 1 => 1/(60+1), rank 2 => 1/(60+2), rank 3 => 1/(60+3)
      expect(results.length).to eq(3)
      expect(results[0][:chunk_id]).to eq(1)
      expect(results[0][:score]).to be_within(1e-10).of(1.0 / 61)
      expect(results[1][:chunk_id]).to eq(2)
      expect(results[1][:score]).to be_within(1e-10).of(1.0 / 62)
      expect(results[2][:chunk_id]).to eq(3)
      expect(results[2][:score]).to be_within(1e-10).of(1.0 / 63)
    end

    it "fuses multiple lists by summing reciprocal ranks" do
      ranked_lists = [
        [1, 2, 3],    # List A
        [2, 3, 1]     # List B
      ]
      results = service.reciprocal_rank_fusion(ranked_lists)

      scores = results.to_h { |r| [r[:chunk_id], r[:score]] }

      expect(scores[2]).to be_within(1e-10).of(1.0/62 + 1.0/61)
      expect(scores[1]).to be_within(1e-10).of(1.0/61 + 1.0/63)
      expect(scores[3]).to be_within(1e-10).of(1.0/63 + 1.0/62)

      # Item 2 should be ranked first (highest fused score)
      expect(results[0][:chunk_id]).to eq(2)
    end

    it "handles items appearing in only some lists" do
      ranked_lists = [
        [1, 2],
        [3, 1]
      ]
      results = service.reciprocal_rank_fusion(ranked_lists)

      scores = results.to_h { |r| [r[:chunk_id], r[:score]] }

      expect(scores[1]).to be_within(1e-10).of(1.0/61 + 1.0/62)
      expect(scores[2]).to be_within(1e-10).of(1.0/62)
      expect(scores[3]).to be_within(1e-10).of(1.0/61)

      expect(results[0][:chunk_id]).to eq(1)
    end

    it "handles empty lists" do
      expect(service.reciprocal_rank_fusion([])).to eq([])
      expect(service.reciprocal_rank_fusion([[], []])).to eq([])
    end

    it "respects custom k parameter" do
      custom_service = described_class.new(k: 10)
      results = custom_service.reciprocal_rank_fusion([[1, 2]])

      expect(results[0][:score]).to be_within(1e-10).of(1.0 / 11)
      expect(results[1][:score]).to be_within(1e-10).of(1.0 / 12)
    end

    it "allows per-call k override" do
      results = service.reciprocal_rank_fusion([[1, 2]], k: 10)

      expect(results[0][:score]).to be_within(1e-10).of(1.0 / 11)
    end

    it "produces deterministic ordering for tied items" do
      ranked_lists = [
        [1, 2, 3],
        [2, 3, 1],
        [3, 1, 2]
      ]
      results = service.reciprocal_rank_fusion(ranked_lists)
      scores = results.map { |r| r[:score] }

      # All three should have the same fused score
      expect(scores.uniq.length).to eq(1)
    end

    it "correctly handles large ranked lists" do
      big_list = (1..100).to_a
      results = service.reciprocal_rank_fusion([big_list])

      expect(results.length).to eq(100)
      expect(results.first[:chunk_id]).to eq(1)
      expect(results.last[:chunk_id]).to eq(100)
      scores = results.map { |r| r[:score] }
      expect(scores).to eq(scores.sort.reverse)
    end
  end

  describe "#keyword_search", :db do
    let!(:article) { create(:article, title: "Ruby on Rails Guide", published_at: Time.current) }

    let!(:relevant_chunk) do
      create(:article_chunk,
        article: article,
        chunk_index: 0,
        chunk_text: "Ruby on Rails is a web application framework written in Ruby. It emphasizes convention over configuration."
      )
    end

    let!(:irrelevant_chunk) do
      create(:article_chunk,
        article: article,
        chunk_index: 1,
        chunk_text: "Quantum physics explores the behavior of matter at molecular and atomic levels."
      )
    end

    it "returns chunks matching the query ranked by ts_rank" do
      results = service.keyword_search("Ruby Rails framework")

      expect(results).to be_an(Array)
      expect(results.first[:chunk_id]).to eq(relevant_chunk.id)
      expect(results.first[:score]).to be_a(Float)
      expect(results.first[:score]).to be > 0
    end

    it "does not return non-matching chunks" do
      results = service.keyword_search("Ruby Rails framework")
      chunk_ids = results.map { |r| r[:chunk_id] }

      expect(chunk_ids).to include(relevant_chunk.id)
      expect(chunk_ids).not_to include(irrelevant_chunk.id)
    end

    it "respects the limit parameter" do
      results = service.keyword_search("Ruby", limit: 1)
      expect(results.length).to be <= 1
    end

    it "returns empty array for blank query" do
      expect(service.keyword_search("")).to eq([])
      expect(service.keyword_search(nil)).to eq([])
    end
  end

  describe "#vector_search", :db do
    let!(:article) { create(:article, title: "ML Guide", published_at: Time.current) }

    let!(:chunk_with_embedding) do
      create(:article_chunk, :with_embedding,
        article: article,
        chunk_index: 0,
        chunk_text: "Machine learning is a subset of artificial intelligence."
      )
    end

    it "returns chunks ranked by cosine similarity" do
      fake_embedding = Array.new(768) { rand(-1.0..1.0) }
      without_partial_double_verification do
        allow(EmbeddingService).to receive(:embed_query).and_return(fake_embedding)
      end

      results = service.vector_search("machine learning")

      expect(results).to be_an(Array)
      expect(results.first[:chunk_id]).to eq(chunk_with_embedding.id)
      expect(results.first[:distance]).to be_a(Float)
    end

    it "calls EmbeddingService with the query" do
      fake_embedding = Array.new(768) { 0.0 }
      called_with = nil
      without_partial_double_verification do
        allow(EmbeddingService).to receive(:embed_query) { |q| called_with = q; fake_embedding }
      end

      service.vector_search("test query")
      expect(called_with).to eq("test query")
    end

    it "returns empty array for blank query" do
      expect(service.vector_search("")).to eq([])
    end
  end

  describe "#recency_search", :db do
    let!(:recent_article) { create(:article, :recent, title: "Fresh News") }
    let!(:old_article) { create(:article, :old, title: "Ancient History") }

    let!(:recent_chunk) do
      create(:article_chunk,
        article: recent_article,
        chunk_index: 0,
        chunk_text: "Breaking news about technology trends in software engineering."
      )
    end

    let!(:old_chunk) do
      create(:article_chunk,
        article: old_article,
        chunk_index: 0,
        chunk_text: "Historical developments in technology and software engineering."
      )
    end

    it "ranks recent chunks higher than old ones" do
      results = service.recency_search("technology software")

      expect(results.length).to eq(2)
      expect(results[0][:chunk_id]).to eq(recent_chunk.id)
      expect(results[0][:recency_score]).to be > results[1][:recency_score]
    end

    it "applies exponential decay with 30-day half-life" do
      results = service.recency_search("technology software")

      old_result = results.find { |r| r[:chunk_id] == old_chunk.id }
      # 90 days old with 30-day half-life: score ≈ 0.5^3 = 0.125
      expect(old_result[:recency_score]).to be_within(0.05).of(0.125)
    end

    it "returns empty array for blank query" do
      expect(service.recency_search("")).to eq([])
    end

    it "excludes unpublished articles" do
      unpublished = create(:article, :unpublished, title: "Draft")
      create(:article_chunk, article: unpublished, chunk_index: 0,
        chunk_text: "Unpublished technology content about software engineering.")

      results = service.recency_search("technology software")
      chunk_ids = results.map { |r| r[:chunk_id] }

      expect(chunk_ids).not_to include(ArticleChunk.where(article: unpublished).first&.id)
    end
  end

  describe "#search (integration)", :db do
    let!(:recent_ruby_article) do
      create(:article, title: "Modern Ruby Patterns", published_at: 2.days.ago)
    end
    let!(:old_ruby_article) do
      create(:article, title: "Classic Ruby Cookbook", published_at: 120.days.ago)
    end

    let!(:chunk_a) do
      create(:article_chunk, :with_embedding,
        article: recent_ruby_article,
        chunk_index: 0,
        chunk_text: "Ruby metaprogramming patterns for building domain-specific languages and expressive APIs."
      )
    end

    let!(:chunk_b) do
      create(:article_chunk, :with_embedding,
        article: old_ruby_article,
        chunk_index: 0,
        chunk_text: "Ruby design patterns including factory method, observer, and strategy patterns for software."
      )
    end

    before do
      fake_embedding = Array.new(768) { rand(-1.0..1.0) }
      without_partial_double_verification do
        allow(EmbeddingService).to receive(:embed_query).and_return(fake_embedding)
      end
    end

    it "returns results with all expected fields" do
      results = service.search("Ruby patterns")

      expect(results).to be_an(Array)
      expect(results).not_to be_empty

      result = results.first
      expect(result).to include(
        :chunk_id, :chunk_text, :article_id, :article_title,
        :published_at, :rrf_score, :keyword_rank, :vector_rank, :recency_rank
      )
    end

    it "respects the limit parameter" do
      results = service.search("Ruby patterns", limit: 1)
      expect(results.length).to be <= 1
    end

    it "fuses keyword, vector, and recency signals" do
      results = service.search("Ruby patterns")

      chunk_ids = results.map { |r| r[:chunk_id] }
      expect(chunk_ids).to include(chunk_a.id)
      expect(chunk_ids).to include(chunk_b.id)

      # Both should have non-nil ranks from all three signal sources
      result_a = results.find { |r| r[:chunk_id] == chunk_a.id }
      expect(result_a[:keyword_rank]).to be_a(Integer)
      expect(result_a[:vector_rank]).to be_a(Integer)
      expect(result_a[:recency_rank]).to be_a(Integer)
    end

    it "includes RRF scores that are positive" do
      results = service.search("Ruby patterns")
      results.each do |r|
        expect(r[:rrf_score]).to be > 0
      end
    end
  end
end
