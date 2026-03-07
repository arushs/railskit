# frozen_string_literal: true

class FixRagSchema < ActiveRecord::Migration[8.1]
  def up
    # Fix legacy document_collections → collections rename
    if table_exists?(:document_collections) && !table_exists?(:collections)
      rename_table :document_collections, :collections

      # Add missing columns from the proper schema
      unless column_exists?(:collections, :slug)
        add_column :collections, :slug, :string
        add_column :collections, :description, :text
        add_column :collections, :documents_count, :integer, default: 0, null: false
        add_column :collections, :user_id, :bigint

        add_index :collections, :slug, unique: true
        add_index :collections, :user_id
      end
    end

    # Fix documents table: rename document_collection_id → collection_id
    if column_exists?(:documents, :document_collection_id)
      if foreign_key_exists?(:documents, :document_collections)
        remove_foreign_key :documents, :document_collections
      end
      rename_column :documents, :document_collection_id, :collection_id

      unless column_exists?(:documents, :content)
        add_column :documents, :content, :text
      end

      add_foreign_key :documents, :collections unless foreign_key_exists?(:documents, :collections)
    end
  end

  def down
    # Not reversible
  end
end
