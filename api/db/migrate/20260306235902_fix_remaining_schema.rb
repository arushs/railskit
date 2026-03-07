# frozen_string_literal: true

class FixRemainingSchema < ActiveRecord::Migration[8.1]
  def change
    # documents.name should be nullable (title is the primary field)
    change_column_null :documents, :name, true

    # voice_sessions.chat_id should be nullable (not all sessions have chats)
    change_column_null :voice_sessions, :chat_id, true

    # chunks need additional fields
    unless column_exists?(:chunks, :start_offset)
      add_column :chunks, :start_offset, :integer, default: 0
    end
    unless column_exists?(:chunks, :end_offset)
      add_column :chunks, :end_offset, :integer, default: 0
    end
    unless column_exists?(:chunks, :embedding)
      add_column :chunks, :embedding, :vector, limit: 1536
    end
  end
end
