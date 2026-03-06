# frozen_string_literal: true

class CreateCollections < ActiveRecord::Migration[8.1]
  def change
    create_table :collections do |t|
      t.string :name, null: false
      t.string :slug, null: false
      t.text :description
      t.references :user, foreign_key: true
      t.jsonb :metadata, default: {}
      t.integer :documents_count, default: 0, null: false

      t.timestamps
    end

    add_index :collections, :slug, unique: true
    add_index :collections, :user_id
  end
end
