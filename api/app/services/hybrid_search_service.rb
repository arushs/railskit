# frozen_string_literal: true

# Hybrid search combining keyword, vector, and recency signals via
# Reciprocal Rank Fusion (RRF).
#
# RRF merges multiple ranked lists without fixed weights:
#   score(d) = sum(1.0 / (k + rank_i(d)))
#
# Reference: Cormack, Clarke & Buettcher (2009) — "Reciprocal Rank Fusion
# outperforms Condorcet and individual Rank Learning Methods"
#
# Usage:
#   HybridSearchService.new.search("machine learning", limit: 10)
#
class HybridSearchService
  # RRF constant — higher k reduces impact of top-ranked items.
  # k=60 is the standard value from the original paper.
  DEFAULT_K = 60

  # Recency half-life in days — score drops to 0.5 after this many days.
  RECENCY_HALF_LIFE_DAYS = 30

  attr_reader :k

  def initialize(k: DEFAULT_K)
    @k = k
  end

  # Full hybrid search pipeline.
  # Returns Array of Hashes:
  #   { chunk_id:, chunk_text:, article_id:, article_title:, published_at:,
  #     rrf_score:, keyword_rank:, vector_rank:, recency_rank: }
  def search(query, limit: 10)
    keyword_results  = keyword_search(query)
    vector_results   = vector_search(query)
    recency_results  = recency_search(query)

    ranked_lists = [
      keyword_results.map { |r| r[:chunk_id] },
      vector_results.map { |r| r[:chunk_id] },
      recency_results.map { |r| r[:chunk_id] }
    ]

    fused = reciprocal_rank_fusion(ranked_lists)

    # Build lookup maps for per-signal ranks (1-indexed)
    keyword_rank_map = build_rank_map(keyword_results.map { |r| r[:chunk_id] })
    vector_rank_map  = build_rank_map(vector_results.map { |r| r[:chunk_id] })
    recency_rank_map = build_rank_map(recency_results.map { |r| r[:chunk_id] })

    chunk_ids = fused.first(limit).map { |r| r[:chunk_id] }
    chunks = ArticleChunk.includes(:article).where(id: chunk_ids).index_by(&:id)

    fused.first(limit).filter_map do |result|
      chunk = chunks[result[:chunk_id]]
      next unless chunk

      {
        chunk_id: chunk.id,
        chunk_text: chunk.chunk_text,
        article_id: chunk.article_id,
        article_title: chunk.article.title,
        published_at: chunk.article.published_at,
        rrf_score: result[:score],
        keyword_rank: keyword_rank_map[chunk.id],
        vector_rank: vector_rank_map[chunk.id],
        recency_rank: recency_rank_map[chunk.id]
      }
    end
  end

  # Full-text keyword search using PostgreSQL tsvector/ts_rank.
  # Returns Array of { chunk_id:, score: } ordered by relevance.
  def keyword_search(query, limit: 30)
    return [] if query.blank?

    chunks = ArticleChunk
      .where("searchable @@ plainto_tsquery('english', ?)", query)
      .select(
        :id,
        Arel.sql("ts_rank(searchable, plainto_tsquery('english', #{ArticleChunk.connection.quote(query)})) AS rank_score")
      )
      .order(Arel.sql("rank_score DESC"))
      .limit(limit)

    chunks.map { |c| { chunk_id: c.id, score: c[:rank_score].to_f } }
  end

  # Vector similarity search using pgvector cosine distance via neighbor gem.
  # Returns Array of { chunk_id:, distance: } ordered by similarity (ascending distance).
  def vector_search(query, limit: 30)
    return [] if query.blank?

    query_embedding = EmbeddingService.embed_query(query)

    neighbors = ArticleChunk
      .nearest_neighbors(:embedding, query_embedding, distance: :cosine)
      .limit(limit)

    neighbors.map { |c| { chunk_id: c.id, distance: c.neighbor_distance } }
  end

  # Recency-based ranking using exponential decay on article published_at.
  # Score = exp(-lambda * age_in_days) where lambda = ln(2) / half_life.
  # Returns Array of { chunk_id:, recency_score: } ordered by recency.
  def recency_search(query, limit: 30)
    return [] if query.blank?

    # First filter to chunks that have at least some keyword relevance,
    # then rank by recency. This avoids returning completely irrelevant
    # chunks just because their article is recent.
    candidate_ids = ArticleChunk
      .where("searchable @@ plainto_tsquery('english', ?)", query)
      .pluck(:id)

    # If no keyword matches, fall back to all chunks from published articles
    if candidate_ids.empty?
      candidate_ids = ArticleChunk
        .joins(:article)
        .where.not(articles: { published_at: nil })
        .pluck(:id)
    end

    return [] if candidate_ids.empty?

    lambda_decay = Math.log(2) / RECENCY_HALF_LIFE_DAYS

    chunks = ArticleChunk
      .joins(:article)
      .where(id: candidate_ids)
      .where.not(articles: { published_at: nil })
      .select(:id, "articles.published_at AS pub_date")

    now = Time.current
    scored = chunks.map do |c|
      age_days = [(now - c[:pub_date].to_time) / 1.day, 0].max
      score = Math.exp(-lambda_decay * age_days)
      { chunk_id: c.id, recency_score: score }
    end

    scored.sort_by { |r| -r[:recency_score] }.first(limit)
  end

  # Reciprocal Rank Fusion — merges N ranked lists into a single ranking.
  #
  # ranked_lists: Array of Arrays, each containing chunk_ids in ranked order.
  # k: RRF constant (default 60).
  #
  # Returns Array of { chunk_id:, score: } sorted by fused score descending.
  def reciprocal_rank_fusion(ranked_lists, k: nil)
    k_val = k || @k
    scores = Hash.new(0.0)

    ranked_lists.each do |ranked_list|
      ranked_list.each_with_index do |chunk_id, index|
        rank = index + 1 # 1-indexed
        scores[chunk_id] += 1.0 / (k_val + rank)
      end
    end

    scores
      .map { |chunk_id, score| { chunk_id: chunk_id, score: score } }
      .sort_by { |r| -r[:score] }
  end

  private

  # Build a hash of { id => 1-indexed rank } from an ordered array of ids.
  def build_rank_map(ids)
    ids.each_with_index.to_h { |id, i| [id, i + 1] }
  end
end
