# frozen_string_literal: true

class AddTwoFactorConfirmableLockableToUsers < ActiveRecord::Migration[8.1]
  def change
    # Two-Factor Authentication (devise-two-factor)
    add_column :users, :otp_secret, :string
    add_column :users, :consumed_timestep, :integer
    add_column :users, :otp_required_for_login, :boolean, default: false, null: false
    add_column :users, :otp_backup_codes, :text, array: true

    # Confirmable
    add_column :users, :confirmation_token, :string
    add_column :users, :confirmed_at, :datetime
    add_column :users, :confirmation_sent_at, :datetime
    add_column :users, :unconfirmed_email, :string

    add_index :users, :confirmation_token, unique: true

    # Lockable
    add_column :users, :failed_attempts, :integer, default: 0, null: false
    add_column :users, :unlock_token, :string
    add_column :users, :locked_at, :datetime

    add_index :users, :unlock_token, unique: true

    # Backfill existing users as confirmed
    reversible do |dir|
      dir.up do
        execute "UPDATE users SET confirmed_at = created_at WHERE confirmed_at IS NULL"
      end
    end
  end
end
