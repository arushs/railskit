# frozen_string_literal: true

class CreateVoiceSessions < ActiveRecord::Migration[8.1]
  def change
    create_table :voice_sessions do |t|
      t.references :chat, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.string :status, null: false, default: "active"
      t.datetime :started_at, null: false
      t.datetime :ended_at
      t.integer :duration
      t.string :audio_format, default: "pcm_16000"
      t.references :voice_preset, foreign_key: true

      t.timestamps
    end

    add_index :voice_sessions, :status
  end
end
