# frozen_string_literal: true

class CreateAgentWorkflows < ActiveRecord::Migration[8.0]
  def change
    create_table :agent_workflows do |t|
      t.string :name, null: false
      t.text :description
      t.string :coordinator_agent, null: false
      t.jsonb :config, default: {}

      t.timestamps
    end

    add_index :agent_workflows, :name, unique: true
  end
end
