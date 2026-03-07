# frozen_string_literal: true

class AddMissingDocumentFields < ActiveRecord::Migration[8.1]
  def change
    change_table :documents, bulk: true do |t|
      t.string :title unless column_exists?(:documents, :title)
      t.string :source_type unless column_exists?(:documents, :source_type)
      t.text :raw_content unless column_exists?(:documents, :raw_content)
      t.string :source_url unless column_exists?(:documents, :source_url)
      t.integer :chunk_count, default: 0 unless column_exists?(:documents, :chunk_count)
    end
  end
end
