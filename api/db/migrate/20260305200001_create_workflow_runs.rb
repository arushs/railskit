# frozen_string_literal: true

class CreateWorkflowRuns < ActiveRecord::Migration[8.0]
  def change
    create_table :workflow_runs do |t|
      t.references :agent_workflow, null: false, foreign_key: true
      t.string :status, null: false, default: "pending"
      t.jsonb :input, default: {}
      t.jsonb :output, default: {}
      t.jsonb :context, default: {}
      t.datetime :started_at
      t.datetime :completed_at

      t.timestamps
    end

    add_index :workflow_runs, :status
  end
end
