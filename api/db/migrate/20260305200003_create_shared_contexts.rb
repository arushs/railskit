# frozen_string_literal: true

class CreateSharedContexts < ActiveRecord::Migration[8.0]
  def change
    create_table :shared_contexts do |t|
      t.references :workflow_run, null: false, foreign_key: true
      t.string :key, null: false
      t.jsonb :value, default: {}
      t.string :written_by

      t.timestamps
    end

    add_index :shared_contexts, [:workflow_run_id, :key], unique: true
  end
end
