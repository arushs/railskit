# frozen_string_literal: true

class DeviseCreateUsers < ActiveRecord::Migration[8.1]
  def change
    create_table :users do |t|
      ## Database authenticatable
      t.string :email,              null: false, default: ""
      t.string :encrypted_password, null: false, default: ""

      ## Recoverable
      t.string   :reset_password_token
      t.datetime :reset_password_sent_at

      ## Rememberable
      t.datetime :remember_created_at

      ## Trackable
      t.integer  :sign_in_count, default: 0, null: false
      t.datetime :current_sign_in_at
      t.datetime :last_sign_in_at
      t.string   :current_sign_in_ip
      t.string   :last_sign_in_ip

      ## Profile
      t.string  :name
      t.string  :avatar_url
      t.string  :plan, null: false, default: "free"

      ## OAuth
      t.string :provider
      t.string :uid

      ## Magic link
      t.string   :magic_link_token
      t.datetime :magic_link_sent_at

      ## JWT revocation (denylist strategy uses separate table)
      t.string :jti, null: false

      t.timestamps null: false
    end

    add_index :users, :email,                unique: true
    add_index :users, :reset_password_token, unique: true
    add_index :users, :jti,                  unique: true
    add_index :users, [:provider, :uid],     unique: true
    add_index :users, :magic_link_token,     unique: true

    # JWT denylist for token revocation
    create_table :jwt_denylists do |t|
      t.string   :jti, null: false
      t.datetime :exp, null: false
    end

    add_index :jwt_denylists, :jti
  end
end
