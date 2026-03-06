# frozen_string_literal: true

class CreateDocuments < ActiveRecord::Migration[8.1]
  def change
    create_table :documents do |t|
      t.references :collection, null: false, foreign_key: true
      t.string :title, null: false
      t.string :source_type       # file, url, text
      t.string :source_url
      t.string :content_type      # text/plain, application/pdf, text/markdown, etc.
      t.bigint :file_size
      t.string :status, default: "pending", null: false  # pending, processing, ready, error
      t.text :error_message
      t.text :raw_content         # original text content
      t.integer :chunk_count, default: 0, null: false
      t.jsonb :metadata, default: {}

      t.timestamps
    end

    add_index :documents, :status
    add_index :documents, [:collection_id, :status]
  end
end
