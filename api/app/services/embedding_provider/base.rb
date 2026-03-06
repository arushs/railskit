# frozen_string_literal: true

module EmbeddingProvider
  class Base
    def embed(text)
      raise NotImplementedError
    end

    def embed_batch(texts)
      texts.map { |t| embed(t) }
    end

    def dimensions
      raise NotImplementedError
    end

    def model_name
      raise NotImplementedError
    end
  end
end
