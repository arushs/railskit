class CreateArticlesAndArticleChunks < ActiveRecord::Migration[8.1]
  def change
    # Enable pgvector extension for vector similarity search
    enable_extension "vector"

    create_table :articles do |t|
      t.string :title, null: false
      t.text :body, null: false
      t.datetime :published_at

      t.timestamps
    end

    add_index :articles, :published_at

    create_table :article_chunks do |t|
      t.references :article, null: false, foreign_key: true
      t.text :chunk_text, null: false
      t.integer :chunk_index, null: false
      t.vector :embedding, limit: 768 # 768-dimensional embeddings
      t.tsvector :searchable

      t.timestamps
    end

    add_index :article_chunks, [:article_id, :chunk_index], unique: true
    add_index :article_chunks, :searchable, using: :gin
    add_index :article_chunks, :embedding, using: :hnsw, opclass: :vector_cosine_ops
  end
end
