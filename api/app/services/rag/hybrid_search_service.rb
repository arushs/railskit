# frozen_string_literal: true

module Rag
  # HybridSearchService combines vector similarity and full-text search
  # using Reciprocal Rank Fusion (RRF) to produce superior results.
  #
  # RRF formula: score(d) = Σ 1 / (k + rank_i(d))
  #   where k is a constant (default 60) and rank_i is the rank in retriever i
  #
  # Usage:
  #   results = Rag::HybridSearchService.search("billing question",
  #     collection_ids: [1, 2], limit: 5)
  #
  #   # Vector-only (disable lexical)
  #   results = Rag::HybridSearchService.search("...", mode: :vector)
  #
  #   # Lexical-only (disable vector)
  #   results = Rag::HybridSearchService.search("...", mode: :lexical)
  #
  class HybridSearchService
    Result = Data.define(:chunk, :score, :document_title, :collection_name, :vector_rank, :lexical_rank)

    # RRF constant — higher k reduces the impact of high-ranking outliers.
    # 60 is the standard value from the original Cormack et al. (2009) paper.
    DEFAULT_K = 60

    MODES = %i[hybrid vector lexical].freeze

    class << self
      # @param query [String] search query
      # @param collection [Collection] single collection (optional)
      # @param collection_ids [Array<Integer>] collection IDs to search (optional)
      # @param limit [Integer] max results to return
      # @param candidates [Integer] how many candidates to fetch per retriever
      # @param mode [Symbol] :hybrid (default), :vector, or :lexical
      # @param k [Integer] RRF constant
      # @param threshold [Float] minimum RRF score to include (0 = include all)
      # @return [Array<Result>]
      def search(query, collection: nil, collection_ids: nil, limit: 5, candidates: 20,
                 mode: :hybrid, k: DEFAULT_K, threshold: 0.0)
        raise ArgumentError, "Unknown mode: #{mode}. Use: #{MODES.join(', ')}" unless MODES.include?(mode)
        return [] if query.blank?

        scope = base_scope(collection: collection, collection_ids: collection_ids)

        vector_ranked = {}
        lexical_ranked = {}

        # Vector retrieval
        if mode != :lexical
          vector_ranked = vector_search(query, scope, candidates)
        end

        # Lexical retrieval
        if mode != :vector
          lexical_ranked = lexical_search(query, scope, candidates)
        end

        # Merge via RRF
        all_chunk_ids = (vector_ranked.keys + lexical_ranked.keys).uniq
        return [] if all_chunk_ids.empty?

        scored = all_chunk_ids.map do |chunk_id|
          v_rank = vector_ranked[chunk_id]
          l_rank = lexical_ranked[chunk_id]

          rrf_score = 0.0
          rrf_score += 1.0 / (k + v_rank) if v_rank
          rrf_score += 1.0 / (k + l_rank) if l_rank

          { chunk_id: chunk_id, score: rrf_score, vector_rank: v_rank, lexical_rank: l_rank }
        end

        scored.sort_by! { |s| -s[:score] }
        scored.reject! { |s| s[:score] < threshold } if threshold > 0

        top = scored.first(limit)
        return [] if top.empty?

        # Batch-load chunks with associations
        chunks_by_id = Chunk.includes(document: :collection)
                            .where(id: top.map { |s| s[:chunk_id] })
                            .index_by(&:id)

        top.filter_map do |s|
          chunk = chunks_by_id[s[:chunk_id]]
          next unless chunk # safety: chunk may have been deleted between search and load

          Result.new(
            chunk: chunk,
            score: s[:score].round(6),
            document_title: chunk.document.title,
            collection_name: chunk.document.collection.name,
            vector_rank: s[:vector_rank],
            lexical_rank: s[:lexical_rank]
          )
        end
      end

      # Format results for LLM context injection
      def format_for_context(results)
        return "" if results.empty?

        results.map.with_index(1) do |result, i|
          <<~CONTEXT
            [Source #{i}: #{result.document_title} (#{result.collection_name}) — relevance: #{(result.score * 100).round(1)}]
            #{result.chunk.content}
          CONTEXT
        end.join("\n---\n\n")
      end

      private

      def base_scope(collection: nil, collection_ids: nil)
        scope = Chunk.joins(document: :collection)
                     .where(documents: { status: "ready" })

        if collection
          scope = scope.where(documents: { collection_id: collection.id })
        elsif collection_ids&.any?
          scope = scope.where(documents: { collection_id: collection_ids })
        end

        scope
      end

      # Vector similarity search via pgvector
      # Returns { chunk_id => rank } (1-indexed)
      def vector_search(query, scope, candidates)
        embedding = EmbeddingService.embed(query)

        neighbors = scope
          .nearest_neighbors(:embedding, embedding, distance: "cosine")
          .limit(candidates)

        ranked = {}
        neighbors.each_with_index do |chunk, idx|
          ranked[chunk.id] = idx + 1
        end
        ranked
      end

      # Full-text search via PostgreSQL tsvector/tsquery
      # Returns { chunk_id => rank } (1-indexed)
      def lexical_search(query, scope, candidates)
        tsquery = sanitize_tsquery(query)
        return {} if tsquery.blank?

        results = scope
          .where("chunks.searchable @@ to_tsquery('english', ?)", tsquery)
          .order(Arel.sql("ts_rank_cd(chunks.searchable, to_tsquery('english', #{Chunk.connection.quote(tsquery)})) DESC"))
          .limit(candidates)

        ranked = {}
        results.each_with_index do |chunk, idx|
          ranked[chunk.id] = idx + 1
        end
        ranked
      end

      # Convert user query to a safe tsquery string
      # "billing reset password" → "billing & reset & password"
      def sanitize_tsquery(query)
        words = query.to_s.strip.split(/\s+/).map do |word|
          # Strip non-alphanumeric, keep basic characters
          cleaned = word.gsub(/[^\w'-]/, "")
          cleaned.empty? ? nil : cleaned
        end.compact

        return "" if words.empty?

        words.join(" & ")
      end
    end
  end
end
