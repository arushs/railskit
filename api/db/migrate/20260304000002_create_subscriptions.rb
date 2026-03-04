class CreateSubscriptions < ActiveRecord::Migration[8.1]
  def change
    create_table :subscriptions do |t|
      t.references :user, null: false, foreign_key: true
      t.references :plan, null: false, foreign_key: true
      t.string :stripe_subscription_id, null: false
      t.string :stripe_customer_id, null: false
      t.string :status, null: false, default: "incomplete"
      t.datetime :current_period_start
      t.datetime :current_period_end
      t.datetime :cancel_at
      t.datetime :canceled_at
      t.timestamps
    end

    add_index :subscriptions, :stripe_subscription_id, unique: true
    add_index :subscriptions, :stripe_customer_id
    add_index :subscriptions, :status
  end
end
