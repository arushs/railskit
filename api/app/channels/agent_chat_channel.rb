# frozen_string_literal: true

class AgentChatChannel < ApplicationCable::Channel
  def subscribed
    @conversation = Chat.find_by(id: params[:conversation_id])

    if @conversation
      stream_for @conversation
    else
      reject
    end
  end

  def unsubscribed
    stop_all_streams
  end

  # Client sends a message via ActionCable directly (alternative to HTTP stream endpoint).
  # Triggers streaming response broadcast back through the channel.
  def speak(data)
    message = data["message"]
    return unless message.present?

    conversation = Chat.find(params[:conversation_id])
    agent_name = data.fetch("agent_name", "help_desk")

    # Persist the user message immediately
    conversation.persist_message(role: "user", content: message)

    # Enqueue streaming in a background job to avoid blocking the channel
    AgentStreamJob.perform_later(
      conversation_id: conversation.id,
      agent_name: agent_name,
      message: message
    )
  rescue => e
    Rails.logger.error("[AgentChatChannel#speak] #{e.class}: #{e.message}")
    if (conv = Chat.find_by(id: params[:conversation_id]))
      AgentChatChannel.broadcast_to(conv, {
        type: "stream_error",
        error: "Something went wrong. Please try again.",
        conversation_id: params[:conversation_id]
      })
    end
  end
end
