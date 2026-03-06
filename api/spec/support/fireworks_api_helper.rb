# frozen_string_literal: true

# Shared helpers for stubbing Fireworks embedding API calls
module FireworksApiHelper
  FIREWORKS_EMBEDDINGS_URL = "https://api.fireworks.ai/inference/v1/embeddings"

  # Generates a fake embedding vector of the given dimension
  def fake_embedding(dimensions: 768)
    Array.new(dimensions) { rand(-1.0..1.0) }
  end

  # Stubs a successful Fireworks embeddings API call.
  # Accepts the number of embeddings to return.
  def stub_fireworks_embeddings(count: 1, embeddings: nil)
    embeddings ||= Array.new(count) { |i| { "object" => "embedding", "index" => i, "embedding" => fake_embedding } }

    stub_request(:post, FIREWORKS_EMBEDDINGS_URL)
      .to_return(
        status: 200,
        headers: { "Content-Type" => "application/json" },
        body: {
          object: "list",
          data: embeddings,
          model: "nomic-ai/nomic-embed-text-v1.5",
          usage: { prompt_tokens: count * 10, total_tokens: count * 10 }
        }.to_json
      )
  end

  # Stubs a failing Fireworks API call
  def stub_fireworks_embeddings_error(status: 500, body: "Internal Server Error")
    stub_request(:post, FIREWORKS_EMBEDDINGS_URL)
      .to_return(status: status, body: body)
  end
end

RSpec.configure do |config|
  config.include FireworksApiHelper
end
