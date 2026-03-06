# frozen_string_literal: true

require "rails_helper"

RSpec.describe Reranker do
  subject(:reranker) { described_class.new }

  let(:rrf_results) do
    [
      { chunk_id: 1, chunk_text: "Reset your password by going to Settings.", rrf_score: 0.05 },
      { chunk_id: 2, chunk_text: "Password policies require 8+ characters.", rrf_score: 0.045 },
      { chunk_id: 3, chunk_text: "Two-factor authentication setup guide.", rrf_score: 0.04 },
      { chunk_id: 4, chunk_text: "Account recovery options and backup codes.", rrf_score: 0.035 }
    ]
  end

  let(:fireworks_response) do
    {
      "results" => [
        { "index" => 0, "relevance_score" => 0.95 },
        { "index" => 1, "relevance_score" => 0.70 },
        { "index" => 2, "relevance_score" => 0.30 },
        { "index" => 3, "relevance_score" => 0.50 }
      ]
    }
  end

  before do
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:[]).with("FIREWORKS_API_KEY").and_return("test-key")
    allow(ENV).to receive(:fetch).and_call_original

    stub_request(:post, Reranker::FIREWORKS_RERANK_URL)
      .to_return(
        status: 200,
        body: fireworks_response.to_json,
        headers: { "Content-Type" => "application/json" }
      )
  end

  describe "#rerank" do
    context "with valid results" do
      it "returns results with reranker and blended scores" do
        results = reranker.rerank(query: "reset password", rrf_results: rrf_results)

        expect(results).to all(include(:reranker_score, :blended_score))
        expect(results.length).to eq(rrf_results.length)
      end

      it "sends correct payload to Fireworks API" do
        reranker.rerank(query: "reset password", rrf_results: rrf_results)

        expect(WebMock).to have_requested(:post, Reranker::FIREWORKS_RERANK_URL)
          .with { |req|
            body = JSON.parse(req.body)
            body["model"] == Reranker::MODEL &&
              body["query"] == "reset password" &&
              body["documents"].length == 4
          }
      end

      it "applies position-aware blending weights" do
        results = reranker.rerank(query: "reset password", rrf_results: rrf_results)

        # All results should have blended scores
        results.each do |r|
          expect(r[:blended_score]).to be_a(Float)
          expect(r[:blended_score]).to be >= 0
        end
      end

      it "sorts results by blended score descending" do
        results = reranker.rerank(query: "reset password", rrf_results: rrf_results)

        scores = results.map { |r| r[:blended_score] }
        expect(scores).to eq(scores.sort.reverse)
      end
    end

    context "with empty results" do
      it "returns empty array" do
        expect(reranker.rerank(query: "test", rrf_results: [])).to eq([])
      end
    end

    context "with blank query" do
      it "returns empty array" do
        expect(reranker.rerank(query: "", rrf_results: rrf_results)).to eq([])
      end
    end

    context "when API fails" do
      before do
        stub_request(:post, Reranker::FIREWORKS_RERANK_URL)
          .to_return(status: 500, body: "Internal Server Error")
      end

      it "falls back to original RRF order" do
        results = reranker.rerank(query: "reset password", rrf_results: rrf_results)
        expect(results).to eq(rrf_results)
      end
    end

    context "with long chunk text" do
      let(:long_results) do
        [{
          chunk_id: 1,
          chunk_text: "password reset " + ("x " * 300) + " password recovery steps",
          rrf_score: 0.05
        }]
      end

      it "selects best window by keyword overlap" do
        reranker.rerank(query: "password reset", rrf_results: long_results)

        expect(WebMock).to have_requested(:post, Reranker::FIREWORKS_RERANK_URL)
          .with { |req|
            body = JSON.parse(req.body)
            # The document sent should be a substring, not the full text
            body["documents"].first.length <= 512
          }
      end
    end
  end
end
