# frozen_string_literal: true

module VectorStore
  class Base
    def store(chunk, vector)
      raise NotImplementedError
    end

    def search(query_vector, collection: nil, limit: 5, threshold: 0.0)
      raise NotImplementedError
    end

    def delete(chunk_id)
      raise NotImplementedError
    end

    def delete_by_document(document_id)
      raise NotImplementedError
    end
  end
end
