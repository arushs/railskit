class CreatePlans < ActiveRecord::Migration[8.1]
  def change
    create_table :plans do |t|
      t.string :name, null: false
      t.string :slug, null: false
      t.string :stripe_price_id, null: false
      t.string :interval, null: false, default: "month"
      t.integer :amount_cents, null: false, default: 0
      t.string :currency, null: false, default: "usd"
      t.jsonb :features, null: false, default: {}
      t.boolean :active, null: false, default: true
      t.integer :sort_order, null: false, default: 0
      t.timestamps
    end

    add_index :plans, :slug, unique: true
    add_index :plans, :stripe_price_id, unique: true
    add_index :plans, :active
  end
end
