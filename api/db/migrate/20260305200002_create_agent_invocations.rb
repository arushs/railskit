# frozen_string_literal: true

class CreateAgentInvocations < ActiveRecord::Migration[8.0]
  def change
    create_table :agent_invocations do |t|
      t.references :workflow_run, null: false, foreign_key: true
      t.string :agent_name, null: false
      t.string :role, null: false, default: "specialist"
      t.jsonb :input, default: {}
      t.jsonb :output, default: {}
      t.string :status, null: false, default: "pending"
      t.bigint :parent_invocation_id
      t.datetime :started_at
      t.datetime :completed_at

      t.timestamps
    end

    add_index :agent_invocations, :agent_name
    add_index :agent_invocations, :status
    add_index :agent_invocations, :parent_invocation_id
    add_foreign_key :agent_invocations, :agent_invocations, column: :parent_invocation_id
  end
end
