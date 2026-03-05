class CreateConversations < ActiveRecord::Migration[8.1]
  def change
    create_table :conversations do |t|
      t.string :title
      t.references :user, null: false, foreign_key: true
      t.string :model
      t.string :provider
      t.text :system_prompt
      t.jsonb :metadata

      t.timestamps
    end

    add_index :conversations, [:user_id, :updated_at]
  end
end
