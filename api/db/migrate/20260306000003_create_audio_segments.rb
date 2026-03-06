# frozen_string_literal: true

class CreateAudioSegments < ActiveRecord::Migration[8.1]
  def change
    create_table :audio_segments do |t|
      t.references :voice_session, null: false, foreign_key: true
      t.binary :content, null: false
      t.float :duration
      t.string :speaker, null: false
      t.text :transcript
      t.integer :sequence_number

      t.timestamps
    end

    add_index :audio_segments, [:voice_session_id, :sequence_number]
    add_index :audio_segments, :speaker
  end
end
