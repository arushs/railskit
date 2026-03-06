# frozen_string_literal: true

require "rails_helper"

RSpec.describe KnowledgeSearchTool do
  subject(:tool) { described_class.new }

  let(:search_results) do
    [
      {
        chunk_id: 1,
        chunk_text: "To reset your password, go to Settings > Security > Reset Password and follow the prompts.",
        article_id: 10,
        article_title: "How to Reset Your Password",
        published_at: 2.days.ago,
        url: "/help/reset-password",
        rrf_score: 0.05,
        blended_score: 0.85
      },
      {
        chunk_id: 2,
        chunk_text: "Invoices are generated on the 1st of each month. You can view them under Billing > History.",
        article_id: 20,
        article_title: "Billing FAQ",
        published_at: 1.week.ago,
        url: "/help/billing-faq",
        rrf_score: 0.04,
        blended_score: 0.72
      }
    ]
  end

  let(:mock_service) { instance_double(HybridSearchService) }

  before do
    allow(HybridSearchService).to receive(:new).and_return(mock_service)
  end

  describe "#execute" do
    context "with successful search" do
      before do
        allow(mock_service).to receive(:search).with("reset password", limit: 3).and_return(search_results)
      end

      it "returns formatted results from HybridSearchService" do
        result = tool.execute(query: "reset password")

        expect(result[:query]).to eq("reset password")
        expect(result[:results].length).to eq(2)
      end

      it "includes title, url, excerpt, and score for each result" do
        result = tool.execute(query: "reset password")
        first = result[:results].first

        expect(first[:title]).to eq("How to Reset Your Password")
        expect(first[:url]).to eq("/help/reset-password")
        expect(first[:score]).to eq(0.85)
        expect(first[:excerpt]).to be_present
      end

      it "truncates long excerpts" do
        long_text = "A" * 300
        search_results.first[:chunk_text] = long_text
        allow(mock_service).to receive(:search).and_return(search_results)

        result = tool.execute(query: "reset password")
        expect(result[:results].first[:excerpt].length).to be <= 203 # 200 + "..."
      end

      it "respects custom limit" do
        allow(mock_service).to receive(:search).with("reset password", limit: 1).and_return([search_results.first])

        result = tool.execute(query: "reset password", limit: 1)
        expect(result[:results].length).to eq(1)
      end
    end

    context "when article has no URL" do
      before do
        no_url_results = [search_results.first.merge(url: nil)]
        allow(mock_service).to receive(:search).and_return(no_url_results)
      end

      it "falls back to article path" do
        result = tool.execute(query: "reset password")
        expect(result[:results].first[:url]).to eq("/articles/10")
      end
    end

    context "when search fails" do
      before do
        allow(mock_service).to receive(:search).and_raise(StandardError, "DB connection failed")
      end

      it "returns error response" do
        result = tool.execute(query: "reset password")

        expect(result[:results]).to eq([])
        expect(result[:error]).to eq("Search temporarily unavailable")
      end
    end
  end
end
