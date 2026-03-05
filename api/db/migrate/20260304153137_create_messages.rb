# frozen_string_literal: true

class CreateMessages < ActiveRecord::Migration[8.1]
  def change
    create_table :messages do |t|
      # A message belongs to either a conversation or a chat (or both for bridged use)
      t.references :conversation, null: true, foreign_key: true
      t.references :chat, null: true, foreign_key: true

      t.string :role, null: false
      t.text :content

      # LLM metadata
      t.string :model_id
      t.integer :input_tokens
      t.integer :output_tokens
      t.integer :token_count
      t.decimal :cost_cents

      # Tool calling
      t.jsonb :tool_calls
      t.jsonb :tool_result
      t.string :tool_call_id
      t.string :name

      t.string :finish_reason

      t.timestamps
    end

    add_index :messages, [:conversation_id, :created_at]
    add_index :messages, [:chat_id, :created_at]
    add_index :messages, :role
  end
end
