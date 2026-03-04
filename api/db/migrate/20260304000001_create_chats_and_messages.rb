# frozen_string_literal: true

class CreateChatsAndMessages < ActiveRecord::Migration[8.1]
  def change
    create_table :chats, id: :uuid do |t|
      t.string :agent_class, null: false
      t.string :model_id
      t.references :user, type: :uuid, null: true, foreign_key: false
      t.jsonb :metadata, default: {}
      t.timestamps
    end

    create_table :messages, id: :uuid do |t|
      t.references :chat, type: :uuid, null: false, foreign_key: true
      t.string :role, null: false
      t.text :content
      t.string :model_id
      t.integer :input_tokens
      t.integer :output_tokens
      t.jsonb :tool_calls, default: {}
      t.jsonb :tool_result
      t.timestamps
    end

    add_index :chats, :agent_class
    add_index :messages, :role
    add_index :messages, :created_at
  end
end
