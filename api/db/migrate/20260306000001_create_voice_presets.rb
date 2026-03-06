# frozen_string_literal: true

class CreateVoicePresets < ActiveRecord::Migration[8.1]
  def change
    create_table :voice_presets do |t|
      t.string :name, null: false
      t.string :provider, null: false, default: "elevenlabs"
      t.string :voice_id, null: false
      t.jsonb :settings, default: {}
      t.boolean :default, default: false

      t.timestamps
    end

    add_index :voice_presets, :name, unique: true
    add_index :voice_presets, :provider
  end
end
