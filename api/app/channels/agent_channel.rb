# frozen_string_literal: true

# AgentChannel handles real-time streaming of LLM responses to the frontend.
#
# Client subscribes with: { channel: "AgentChannel", conversation_id: 123 }
# Client sends messages with: channel.perform("send_message", { content: "Hello" })
#
# Server broadcasts events:
#   { type: "chunk",       data: { content: "partial text", index: 0 } }
#   { type: "tool_call",   data: { id: "call_xxx", name: "fn", arguments: "{}" } }
#   { type: "message",     data: { id: 1, role: "assistant", content: "full text", ... } }
#   { type: "error",       data: { message: "Something went wrong" } }
#   { type: "done",        data: { finish_reason: "stop", usage: { ... } } }
#   { type: "thinking",    data: { content: "reasoning..." } }
#
class AgentChannel < ApplicationCable::Channel
  def subscribed
    @conversation = current_user.conversations.find_by(id: params[:conversation_id])

    if @conversation
      stream_for @conversation
    else
      reject
    end
  end

  def unsubscribed
    # Cleanup if needed (e.g., cancel in-flight requests)
    stop_all_streams
  end

  # Called when client sends a message via ActionCable
  # data: { content: "user message", tools: [...] }
  def send_message(data)
    content = data["content"]
    tools = data["tools"] # Optional tool definitions
    return if content.blank?

    # Persist user message
    user_msg = @conversation.messages.create!(
      role: "user",
      content: content
    )

    # Broadcast user message confirmation
    AgentChannel.broadcast_to(@conversation, {
      type: "message",
      data: serialize_message(user_msg)
    })

    # Stream the LLM response asynchronously
    AgentStreamJob.perform_later(
      conversation_id: @conversation.id,
      tools: tools
    )
  end

  private

  def serialize_message(msg)
    {
      id: msg.id,
      role: msg.role,
      content: msg.content,
      tool_calls: msg.tool_calls,
      tool_call_id: msg.tool_call_id,
      name: msg.name,
      finish_reason: msg.finish_reason,
      token_count: msg.token_count,
      cost_cents: msg.cost_cents&.to_f,
      created_at: msg.created_at.iso8601
    }
  end
end
