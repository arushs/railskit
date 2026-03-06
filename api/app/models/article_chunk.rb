class ArticleChunk < ApplicationRecord
  belongs_to :article

  has_neighbors :embedding

  validates :chunk_text, presence: true
  validates :chunk_index, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :chunk_index, uniqueness: { scope: :article_id }

  scope :search_by_text, ->(query) {
    where("searchable @@ plainto_tsquery('english', ?)", query)
      .order(Arel.sql("ts_rank(searchable, plainto_tsquery('english', #{connection.quote(query)})) DESC"))
  }

  # Auto-populate tsvector before save
  before_save :update_searchable

  private

  def update_searchable
    self.searchable = ActiveRecord::Base.connection.execute(
      ActiveRecord::Base.sanitize_sql_array(
        ["SELECT to_tsvector('english', ?) AS tsv", chunk_text]
      )
    ).first["tsv"]
  end
end
