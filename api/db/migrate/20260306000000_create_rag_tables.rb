# frozen_string_literal: true

class CreateRagTables < ActiveRecord::Migration[8.1]
  def change
    # Enable pgvector extension
    enable_extension "vector"

    create_table :collections do |t|
      t.string :name, null: false
      t.text :description
      t.references :user, null: true, foreign_key: true
      t.jsonb :metadata, default: {}
      t.timestamps
    end

    add_index :collections, :name, unique: true

    create_table :documents do |t|
      t.references :collection, null: false, foreign_key: true
      t.string :title, null: false
      t.string :source_type, null: false, default: "text" # text, url, pdf, html
      t.text :source_url
      t.text :raw_content
      t.string :status, null: false, default: "pending" # pending, processing, ready, error
      t.text :error_message
      t.jsonb :metadata, default: {}
      t.timestamps
    end

    add_index :documents, :status

    create_table :chunks do |t|
      t.references :document, null: false, foreign_key: true
      t.text :content, null: false
      t.integer :position, null: false, default: 0
      t.vector :embedding, limit: 768 # Nomic default; resized at embed time
      t.tsvector :searchable
      t.jsonb :metadata, default: {}
      t.timestamps
    end

    add_index :chunks, [:document_id, :position], unique: true
    add_index :chunks, :searchable, using: :gin
  end
end
