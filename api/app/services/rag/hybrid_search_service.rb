# frozen_string_literal: true

module Rag
  # HybridSearchService combines vector similarity and full-text search
  # using Reciprocal Rank Fusion (RRF) to produce superior results.
  #
  # RRF formula: score(d) = Σ 1 / (k + rank_i(d))
  #   where k is a constant (default 60) and rank_i is the rank in retriever i
  #
  # Supports optional LLM-powered query expansion via QueryExpander:
  #   - :lexical — synonym/related-term expansion for keyword search
  #   - :vector  — semantic rephrasing for embedding similarity
  #   - :hyde    — hypothetical document generation (HyDE)
  #   - :multi   — run both :lexical and :hyde, merge all candidate sets
  #
  # And optional chunked reranking via RerankerService for position-aware
  # score blending after initial retrieval.
  #
  # Usage:
  #   results = Rag::HybridSearchService.search("billing question",
  #     collection_ids: [1, 2], limit: 5)
  #
  #   # With query expansion
  #   results = Rag::HybridSearchService.search("billing question",
  #     expand: :hyde, limit: 5)
  #
  #   # With reranking
  #   results = Rag::HybridSearchService.search("billing question",
  #     rerank: true, limit: 5)
  #
  #   # Full pipeline: expand + search + rerank
  #   results = Rag::HybridSearchService.search("billing question",
  #     expand: :multi, rerank: true, limit: 5)
  #
  class HybridSearchService
    Result = Data.define(:chunk, :score, :document_title, :collection_name, :vector_rank, :lexical_rank)

    # RRF constant — higher k reduces the impact of high-ranking outliers.
    # 60 is the standard value from the original Cormack et al. (2009) paper.
    DEFAULT_K = 60

    MODES = %i[hybrid vector lexical].freeze
    EXPAND_STRATEGIES = %i[lexical vector hyde multi].freeze

    class << self
      # @param query [String] search query
      # @param collection [Collection] single collection (optional)
      # @param collection_ids [Array<Integer>] collection IDs to search (optional)
      # @param limit [Integer] max results to return
      # @param candidates [Integer] how many candidates to fetch per retriever
      # @param mode [Symbol] :hybrid (default), :vector, or :lexical
      # @param k [Integer] RRF constant
      # @param threshold [Float] minimum RRF score to include (0 = include all)
      # @param expand [Symbol, nil] query expansion strategy (:lexical, :vector, :hyde, :multi, nil)
      # @param rerank [Boolean] whether to apply chunked reranking after RRF
      # @param rerank_options [Hash] options passed to RerankerService (chunk_size, position_decay, etc.)
      # @return [Array<Result>]
      def search(query, collection: nil, collection_ids: nil, limit: 5, candidates: 20,
                 mode: :hybrid, k: DEFAULT_K, threshold: 0.0,
                 expand: nil, rerank: false, rerank_options: {})
        raise ArgumentError, "Unknown mode: #{mode}. Use: #{MODES.join(', ')}" unless MODES.include?(mode)
        if expand && !EXPAND_STRATEGIES.include?(expand)
          raise ArgumentError, "Unknown expand strategy: #{expand}. Use: #{EXPAND_STRATEGIES.join(', ')}"
        end
        return [] if query.blank?

        scope = base_scope(collection: collection, collection_ids: collection_ids)

        # Phase 1: Query expansion (optional)
        queries = build_query_variants(query, expand: expand, mode: mode)

        # Phase 2: Multi-query retrieval + RRF fusion
        # When expanded, we fetch candidates for each query variant and merge
        rerank_candidates = rerank ? [candidates, limit * 4].max : candidates
        scored = retrieve_and_fuse(queries, scope, rerank_candidates, mode, k)

        scored.reject! { |s| s[:score] < threshold } if threshold > 0
        return [] if scored.empty?

        # Phase 3: Chunked reranking (optional)
        if rerank && scored.length > 1
          scored = RerankerService.rerank(
            query: query,
            candidates: scored,
            limit: limit,
            **rerank_options
          )
        end

        top = scored.first(limit)
        return [] if top.empty?

        hydrate_results(top)
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

      # Build query variants based on expansion strategy.
      # Returns an array of { query:, target: } hashes where target is :vector, :lexical, or :both
      def build_query_variants(query, expand:, mode:)
        return [{ query: query, target: :both }] unless expand

        variants = [{ query: query, target: :both }] # always include original

        case expand
        when :lexical
          expanded = QueryExpander.expand(query, strategy: :lexical)
          variants << { query: expanded.text, target: :lexical } if expanded.text != query
        when :vector
          expanded = QueryExpander.expand(query, strategy: :vector)
          variants << { query: expanded.text, target: :vector } if expanded.text != query
        when :hyde
          expanded = QueryExpander.expand(query, strategy: :hyde)
          variants << { query: expanded.text, target: :vector } if expanded.text != query
        when :multi
          expansions = QueryExpander.expand_multi(query, strategies: [:lexical, :hyde])
          expansions.each do |exp|
            next if exp.text == query
            target = exp.strategy == :lexical ? :lexical : :vector
            variants << { query: exp.text, target: target }
          end
        end

        variants
      end

      # Run retrieval for each query variant and merge via RRF
      def retrieve_and_fuse(queries, scope, candidates, mode, k)
        # Collect per-variant rank maps: { chunk_id => rank } per retriever
        all_vector_ranks = []  # array of hashes
        all_lexical_ranks = [] # array of hashes

        queries.each do |variant|
          q = variant[:query]
          target = variant[:target]

          if mode != :lexical && target != :lexical
            all_vector_ranks << vector_search(q, scope, candidates)
          end

          if mode != :vector && target != :vector
            all_lexical_ranks << lexical_search(q, scope, candidates)
          end
        end

        # Merge all retrievers via RRF: each rank map contributes independently
        all_chunk_ids = Set.new
        rank_maps = all_vector_ranks + all_lexical_ranks
        rank_maps.each { |rm| all_chunk_ids.merge(rm.keys) }

        return [] if all_chunk_ids.empty?

        # Track best vector/lexical rank across variants for the Result struct
        best_vector = {}
        all_vector_ranks.each do |rm|
          rm.each { |cid, rank| best_vector[cid] = [best_vector[cid], rank].compact.min }
        end
        best_lexical = {}
        all_lexical_ranks.each do |rm|
          rm.each { |cid, rank| best_lexical[cid] = [best_lexical[cid], rank].compact.min }
        end

        scored = all_chunk_ids.map do |chunk_id|
          rrf_score = rank_maps.sum do |rm|
            rm[chunk_id] ? 1.0 / (k + rm[chunk_id]) : 0.0
          end

          { chunk_id: chunk_id, score: rrf_score,
            vector_rank: best_vector[chunk_id], lexical_rank: best_lexical[chunk_id] }
        end

        scored.sort_by! { |s| -s[:score] }
        scored
      end

      # Batch-load chunks and build Result structs
      def hydrate_results(scored_entries)
        chunks_by_id = Chunk.includes(document: :collection)
                            .where(id: scored_entries.map { |s| s[:chunk_id] })
                            .index_by(&:id)

        scored_entries.filter_map do |s|
          chunk = chunks_by_id[s[:chunk_id]]
          next unless chunk

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
          cleaned = word.gsub(/[^\w'-]/, "")
          cleaned.empty? ? nil : cleaned
        end.compact

        return "" if words.empty?

        words.join(" & ")
      end
    end
  end
end
