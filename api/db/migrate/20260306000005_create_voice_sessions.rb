# frozen_string_literal: true

class CreateVoiceSessions < ActiveRecord::Migration[8.1]
  def change
    create_table :voice_sessions do |t|
      t.references :user, null: false, foreign_key: true
      t.references :chat, foreign_key: true     # linked conversation for transcript
      t.string :status, default: "idle", null: false  # idle, listening, processing, speaking, error
      t.string :stt_provider                    # openai, deepgram
      t.string :tts_provider                    # openai, elevenlabs
      t.string :tts_voice                       # voice ID or name
      t.string :agent_class                     # which agent handles the conversation
      t.string :language, default: "en"
      t.integer :turn_count, default: 0, null: false
      t.jsonb :metadata, default: {}
      t.datetime :last_activity_at

      t.timestamps
    end

    add_index :voice_sessions, :status
    add_index :voice_sessions, [:user_id, :status]
  end
end
