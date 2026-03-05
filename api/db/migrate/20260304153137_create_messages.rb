class CreateMessages < ActiveRecord::Migration[8.1]
  def change
    create_table :messages do |t|
      t.references :conversation, null: false, foreign_key: true
      t.string :role
      t.text :content
      t.jsonb :tool_calls
      t.string :tool_call_id
      t.string :name
      t.string :finish_reason
      t.integer :token_count
      t.decimal :cost_cents

      t.timestamps
    end

    add_index :messages, [:conversation_id, :created_at]
    add_index :messages, :role
  end
end
