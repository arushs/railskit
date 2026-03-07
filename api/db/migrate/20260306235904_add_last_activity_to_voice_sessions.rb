# frozen_string_literal: true

class AddLastActivityToVoiceSessions < ActiveRecord::Migration[8.1]
  def change
    add_column :voice_sessions, :last_activity_at, :datetime unless column_exists?(:voice_sessions, :last_activity_at)
  end
end
