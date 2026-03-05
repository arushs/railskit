# frozen_string_literal: true

class CreateChatsAndMessages < ActiveRecord::Migration[8.1]
  def change
    create_table :chats do |t|
      t.string :agent_class, null: false
      t.string :model_id
      t.references :user, null: true, foreign_key: true
      t.jsonb :metadata, default: {}
      t.timestamps
    end

    add_index :chats, :agent_class
  end
end
