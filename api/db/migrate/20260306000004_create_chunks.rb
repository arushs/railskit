# frozen_string_literal: true

class CreateChunks < ActiveRecord::Migration[8.1]
  def change
    create_table :chunks do |t|
      t.references :document, null: false, foreign_key: true
      t.text :content, null: false
      t.integer :position, null: false        # chunk order within document
      t.integer :start_offset                 # character offset in raw_content
      t.integer :end_offset
      t.integer :token_count
      t.vector :embedding, limit: 1536        # OpenAI text-embedding-3-small dimension
      t.jsonb :metadata, default: {}

      t.timestamps
    end

    add_index :chunks, [:document_id, :position]
    add_index :chunks, :embedding, using: :ivfflat, opclass: :vector_cosine_ops, name: "index_chunks_on_embedding"
  end
end
