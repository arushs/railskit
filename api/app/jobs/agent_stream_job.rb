# frozen_string_literal: true

class AgentStreamJob < ApplicationJob
  queue_as :default

  def perform(chat_id:, agent_name:, message:)
    chat = Chat.find(chat_id)
    agent_class = "#{agent_name.classify}Agent".constantize
    agent = agent_class.new(chat: chat)

    # Broadcast stream start
    AgentChatChannel.broadcast_to(chat, {
      type: "stream_start",
      chat_id: chat.id
    })

    # Stream token-by-token via RubyLLM's block-based streaming
    full_content = +""

    response = agent.stream(message) do |chunk|
      if chunk.content.present?
        full_content << chunk.content
        AgentChatChannel.broadcast_to(chat, {
          type: "stream_token",
          token: chunk.content,
          chat_id: chat.id
        })
      end
    end

    # Persist the full assistant message
    chat.persist_message(
      role: "assistant",
      content: full_content,
      model_id: response.respond_to?(:model_id) ? response.model_id : nil,
      input_tokens: response.respond_to?(:input_tokens) ? response.input_tokens : nil,
      output_tokens: response.respond_to?(:output_tokens) ? response.output_tokens : nil
    )

    # Broadcast completion with metadata
    AgentChatChannel.broadcast_to(chat, {
      type: "stream_end",
      chat_id: chat.id,
      message_id: chat.messages.last&.id,
      model: response.respond_to?(:model_id) ? response.model_id : nil,
      usage: {
        input_tokens: response.respond_to?(:input_tokens) ? response.input_tokens : nil,
        output_tokens: response.respond_to?(:output_tokens) ? response.output_tokens : nil
      }
    })
  rescue => e
    Rails.logger.error("[AgentStreamJob] #{e.class}: #{e.message}\n#{e.backtrace&.first(5)&.join("\n")}")

    if (chat = Chat.find_by(id: chat_id))
      AgentChatChannel.broadcast_to(chat, {
        type: "stream_error",
        error: "Something went wrong. Please try again.",
        chat_id: chat_id
      })
    end
  end
end
