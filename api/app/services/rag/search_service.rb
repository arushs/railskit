# frozen_string_literal: true

module Rag
  # SearchService provides vector similarity search with optional reranking.
  #
  # Usage:
  #   results = Rag::SearchService.search("How do I reset my password?",
  #     collection: collection, limit: 5)
  #
  #   results = Rag::SearchService.search("billing info",
  #     collection_ids: [1, 2, 3], limit: 10, threshold: 0.8)
  #
  class SearchService
    Result = Data.define(:chunk, :score, :document_title, :collection_name)

    class << self
      # Search across one or more collections
      #
      # @param query [String] the search query
      # @param collection [Collection] single collection to search (optional)
      # @param collection_ids [Array<Integer>] collection IDs to search (optional)
      # @param limit [Integer] max results
      # @param threshold [Float] minimum similarity score (0-1, higher = more similar)
      # @param expand_context [Boolean] include neighboring chunks
      # @return [Array<Result>]
      def search(query, collection: nil, collection_ids: nil, limit: 5, threshold: 0.3, expand_context: false)
        embedding = EmbeddingService.embed(query)

        scope = Chunk.joins(document: :collection)
                     .where(documents: { status: "ready" })

        if collection
          scope = scope.where(documents: { collection_id: collection.id })
        elsif collection_ids&.any?
          scope = scope.where(documents: { collection_id: collection_ids })
        end

        neighbors = scope
          .nearest_neighbors(:embedding, embedding, distance: "cosine")
          .limit(limit * 2) # fetch extra for threshold filtering

        results = neighbors.map do |chunk|
          score = 1.0 - chunk.neighbor_distance # cosine distance → similarity
          next if score < threshold

          Result.new(
            chunk: expand_context ? chunk.neighbors(radius: 1) : chunk,
            score: score.round(4),
            document_title: chunk.document.title,
            collection_name: chunk.document.collection.name
          )
        end.compact.first(limit)

        results
      end

      # Format results for LLM context injection
      def format_for_context(results)
        return "" if results.empty?

        results.map.with_index(1) do |result, i|
          chunk_content = if result.chunk.is_a?(ActiveRecord::Relation)
                           result.chunk.map(&:content).join("\n")
                         else
                           result.chunk.content
                         end

          <<~CONTEXT
            [Source #{i}: #{result.document_title} (#{result.collection_name}) — relevance: #{(result.score * 100).round(1)}%]
            #{chunk_content}
          CONTEXT
        end.join("\n---\n\n")
      end
    end
  end
end
