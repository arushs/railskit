# frozen_string_literal: true

# AgentStreamJob handles the actual LLM API call and streams chunks
# back to the client via ActionCable.
#
# Supports tool calls with automatic re-invocation loop.
#
class AgentStreamJob < ApplicationJob
  queue_as :default

  # Max tool call rounds to prevent infinite loops
  MAX_TOOL_ROUNDS = 10

  def perform(conversation_id:, tools: nil)
    conversation = Conversation.find(conversation_id)
    agent_service = AgentService.new(conversation, tools: tools)

    round = 0
    loop do
      round += 1
      result = agent_service.stream_response do |event|
        AgentChannel.broadcast_to(conversation, event)
      end

      # If the response includes tool calls, execute them and loop
      if result[:finish_reason] == "tool_calls" && round < MAX_TOOL_ROUNDS
        execute_tool_calls(conversation, result[:tool_calls])
        next
      end

      # Done — broadcast completion
      AgentChannel.broadcast_to(conversation, {
        type: "done",
        data: {
          finish_reason: result[:finish_reason],
          usage: result[:usage],
          round: round
        }
      })
      break
    end
  rescue StandardError => e
    Rails.logger.error("[AgentStreamJob] Error: #{e.message}\n#{e.backtrace&.first(5)&.join("\n")}")

    conversation = Conversation.find_by(id: conversation_id)
    if conversation
      AgentChannel.broadcast_to(conversation, {
        type: "error",
        data: { message: e.message }
      })
    end
  end

  private

  def execute_tool_calls(conversation, tool_calls)
    return unless tool_calls.is_a?(Array)

    tool_calls.each do |tc|
      # Execute the tool (override ToolExecutor for your tools)
      result = ToolExecutor.execute(
        name: tc["function"]["name"],
        arguments: tc["function"]["arguments"],
        conversation: conversation
      )

      # Persist tool result as a message
      conversation.messages.create!(
        role: "tool",
        content: result.to_s,
        tool_call_id: tc["id"],
        name: tc["function"]["name"]
      )
    end
  end
end
