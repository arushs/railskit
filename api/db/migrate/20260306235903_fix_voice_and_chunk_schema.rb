# frozen_string_literal: true

class FixVoiceAndChunkSchema < ActiveRecord::Migration[8.1]
  def change
    # voice_sessions.started_at should be nullable
    change_column_null :voice_sessions, :started_at, true

    # chunks need metadata column
    unless column_exists?(:chunks, :metadata)
      add_column :chunks, :metadata, :jsonb, default: {}
    end
  end
end
