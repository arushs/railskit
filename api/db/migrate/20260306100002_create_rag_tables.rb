# frozen_string_literal: true

class CreateRagTables < ActiveRecord::Migration[8.1]
  def change
    create_table :document_collections do |t|
      t.string :name, null: false
      t.string :chunking_strategy, null: false, default: "paragraph"
      t.integer :chunk_size, null: false, default: 512
      t.integer :chunk_overlap, null: false, default: 50
      t.string :embedding_model, null: false, default: "text-embedding-3-small"
      t.jsonb :metadata, default: {}
      t.timestamps
    end

    add_index :document_collections, :name, unique: true

    create_table :documents do |t|
      t.string :name, null: false
      t.string :content_type
      t.bigint :size
      t.string :status, null: false, default: "processing"
      t.text :error_message
      t.references :document_collection, null: false, foreign_key: true
      t.references :user, foreign_key: true
      t.timestamps
    end

    add_index :documents, :status

    create_table :chunks do |t|
      t.text :content, null: false
      t.integer :position, null: false, default: 0
      t.integer :token_count, default: 0
      t.references :document, null: false, foreign_key: true
      t.timestamps
    end

    add_index :chunks, [:document_id, :position]

    create_table :embeddings do |t|
      t.column :vector, "vector(1536)"
      t.references :chunk, null: false, foreign_key: true, index: { unique: true }
      t.string :model_used, null: false, default: "text-embedding-3-small"
      t.timestamps
    end
  end
end
