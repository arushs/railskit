# frozen_string_literal: true

class AddVoiceFieldsToVoiceSessions < ActiveRecord::Migration[8.1]
  def change
    add_column :voice_sessions, :stt_provider, :string, default: "openai"
    add_column :voice_sessions, :tts_provider, :string, default: "openai"
    add_column :voice_sessions, :tts_voice, :string, default: "alloy"
    add_column :voice_sessions, :agent_class, :string, default: "HelpDeskAgent"
    add_column :voice_sessions, :language, :string, default: "en"
    add_column :voice_sessions, :turn_count, :integer, default: 0
  end
end
