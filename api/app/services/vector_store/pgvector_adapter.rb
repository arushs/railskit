# frozen_string_literal: true

module VectorStore
  class PgvectorAdapter < Base
    DISTANCE_METRICS = {
      cosine: "<=>",
      euclidean: "<->",
      inner_product: "<#>"
    }.freeze

    def initialize(distance_metric: :cosine)
      @distance_metric = distance_metric
      @operator = DISTANCE_METRICS.fetch(distance_metric) do
        raise ArgumentError, "Unknown distance metric: #{distance_metric}"
      end
    end

    def store(chunk, vector)
      Embedding.create!(
        chunk: chunk,
        vector: vector.to_s,
        model_used: chunk.document_collection.embedding_model
      )
    end

    def search(query_vector, collection: nil, limit: 5, threshold: 0.0)
      vector_literal = "[#{query_vector.join(',')}]"
      scope = Embedding.joins(chunk: { document: :document_collection })
      scope = scope.where(documents: { document_collection_id: collection.id }) if collection

      results = scope
        .select("embeddings.*, chunks.content, chunks.position, chunks.document_id,
                 (embeddings.vector #{@operator} '#{vector_literal}') AS distance")
        .order(Arel.sql("embeddings.vector #{@operator} '#{vector_literal}'"))
        .limit(limit)

      results.filter_map do |row|
        score = distance_to_score(row.distance)
        next if score < threshold
        { chunk: row.chunk, content: row.content, document: row.chunk.document,
          score: score, distance: row.distance }
      end
    end

    def delete(chunk_id)
      Embedding.where(chunk_id: chunk_id).destroy_all
    end

    def delete_by_document(document_id)
      chunk_ids = Chunk.where(document_id: document_id).pluck(:id)
      Embedding.where(chunk_id: chunk_ids).destroy_all
    end

    def self.create_index!(distance_metric: :cosine)
      operator_class = case distance_metric
                       when :cosine then "vector_cosine_ops"
                       when :euclidean then "vector_l2_ops"
                       when :inner_product then "vector_ip_ops"
                       end
      ActiveRecord::Base.connection.execute(<<~SQL)
        CREATE INDEX IF NOT EXISTS embeddings_vector_idx
        ON embeddings USING ivfflat (vector #{operator_class}) WITH (lists = 100)
      SQL
    end

    private

    def distance_to_score(distance)
      case @distance_metric
      when :cosine then 1.0 - distance.to_f
      when :euclidean then 1.0 / (1.0 + distance.to_f)
      when :inner_product then -distance.to_f
      end
    end
  end
end
