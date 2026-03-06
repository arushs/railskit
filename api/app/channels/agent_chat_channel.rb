# frozen_string_literal: true

class AgentChatChannel < ApplicationCable::Channel
  # Orchestration event types for multi-agent workflows
  ORCHESTRATION_EVENTS = %w[handoff delegation context_update workflow_status].freeze

  def subscribed
    @chat = current_user.chats.find_by(id: params[:chat_id])

    if @chat
      stream_for @chat

      # If a workflow_run_id is provided, also stream orchestration events
      if params[:workflow_run_id].present?
        stream_from "workflow_#{params[:workflow_run_id]}"
      end
    else
      reject
    end
  end

  def unsubscribed
    stop_all_streams
  end

  # Subscribe to a workflow run's orchestration events mid-conversation
  def follow_workflow(data)
    workflow_run_id = data["workflow_run_id"]
    return unless workflow_run_id.present?

    stream_from "workflow_#{workflow_run_id}"
  end

  # Client sends a message via ActionCable directly (alternative to HTTP stream endpoint).
  # Triggers streaming response broadcast back through the channel.
  def speak(data)
    message = data["message"]
    return unless message.present?

    agent_name = data.fetch("agent_name", "help_desk")

    # Persist the user message immediately
    @chat.persist_message(role: "user", content: message)

    # Enqueue streaming in a background job to avoid blocking the channel
    AgentStreamJob.perform_later(
      chat_id: @chat.id,
      agent_name: agent_name,
      message: message
    )
  rescue => e
    Rails.logger.error("[AgentChatChannel#speak] #{e.class}: #{e.message}")
    AgentChatChannel.broadcast_to(@chat, {
      type: "stream_error",
      error: "Something went wrong. Please try again.",
      chat_id: @chat.id
    })
  end
end
