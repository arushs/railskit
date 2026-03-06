# frozen_string_literal: true

class EmbeddingService
  def initialize(embedding_provider: nil, vector_store: nil)
    @embedding_provider = embedding_provider || default_embedding_provider
    @vector_store = vector_store || default_vector_store
  end

  def embed_and_store(chunk)
    vector = @embedding_provider.embed(chunk.content)
    @vector_store.store(chunk, vector)
  end

  def embed_and_store_batch(chunks)
    texts = chunks.map(&:content)
    vectors = @embedding_provider.embed_batch(texts)
    chunks.zip(vectors).map { |chunk, vector| @vector_store.store(chunk, vector) }
  end

  def search(query, collection: nil, limit: 5, threshold: 0.0)
    query_vector = @embedding_provider.embed(query)
    @vector_store.search(query_vector, collection: collection, limit: limit, threshold: threshold)
  end

  private

  def default_embedding_provider
    EmbeddingProvider::OpenaiAdapter.new
  rescue KeyError
    EmbeddingProvider::OllamaAdapter.new
  end

  def default_vector_store
    VectorStore::PgvectorAdapter.new
  end
end
