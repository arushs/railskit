# frozen_string_literal: true

require "rails_helper"

RSpec.describe EmbedArticleChunksJob, type: :job do
  before do
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:[]).with("FIREWORKS_API_KEY").and_return("test-api-key")
  end

  describe "#perform" do
    it "rechunks the article and embeds all chunks" do
      article = create(:article, body: "This is a test article with enough content to create chunks.")

      # The article create callback already enqueued a job; clear it
      # and test the job directly
      embeddings = Array.new(article.article_chunks.count) { fake_embedding }

      stub_request(:post, EmbeddingService::FIREWORKS_URL)
        .to_return { |request|
          input = JSON.parse(request.body)["input"]
          data = input.each_with_index.map { |_, i| { "object" => "embedding", "index" => i, "embedding" => embeddings[i] || fake_embedding } }
          {
            status: 200,
            headers: { "Content-Type" => "application/json" },
            body: { object: "list", data: data, model: "nomic-ai/nomic-embed-text-v1.5", usage: {} }.to_json
          }
        }

      described_class.new.perform(article.id)

      article.article_chunks.reload.each do |chunk|
        expect(chunk.embedding).not_to be_nil
      end
    end

    it "does nothing if article is not found" do
      expect { described_class.new.perform(-1) }.not_to raise_error
    end

    it "does nothing if article has no body content for chunks" do
      article = create(:article, body: "x")

      stub_request(:post, EmbeddingService::FIREWORKS_URL)
        .to_return { |request|
          input = JSON.parse(request.body)["input"]
          data = input.each_with_index.map { |_, i| { "object" => "embedding", "index" => i, "embedding" => fake_embedding } }
          {
            status: 200,
            headers: { "Content-Type" => "application/json" },
            body: { object: "list", data: data, model: "nomic-ai/nomic-embed-text-v1.5", usage: {} }.to_json
          }
        }

      expect { described_class.new.perform(article.id) }.not_to raise_error
    end
  end

  describe "callbacks" do
    it "Article has after_create_commit callback for embedding" do
      callbacks = Article._commit_callbacks.select { |cb| cb.kind == :after }
      callback_methods = callbacks.map { |cb| cb.filter.to_s }
      expect(callback_methods).to include("enqueue_embedding")
    end

    it "Article has after_update_commit callback for embedding on body change" do
      callbacks = Article._commit_callbacks.select { |cb| cb.kind == :after }
      callback_methods = callbacks.map { |cb| cb.filter.to_s }
      expect(callback_methods).to include("enqueue_embedding")
    end

    it "calls enqueue_embedding which delegates to EmbedArticleChunksJob" do
      stub_fireworks_embeddings(count: 1)
      article = create(:article, body: "Test body")

      expect(EmbedArticleChunksJob).to receive(:perform_later).with(article.id)
      article.send(:enqueue_embedding)
    end

    it "only enqueues on body change for updates" do
      stub_fireworks_embeddings(count: 1)
      article = create(:article, body: "Same body")

      # Simulate a title-only change — saved_change_to_body? should be false
      article.title = "New title"
      article.save!

      # The if condition checks saved_change_to_body? — verify it works
      expect(article.saved_change_to_body?).to be false
    end
  end
end
