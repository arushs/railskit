# frozen_string_literal: true

module Api
  # SSE fallback for environments where ActionCable/WebSocket isn't available.
  #
  # POST /api/agent/chat
  #   Body: { conversation_id: 1, content: "Hello", tools: [...] }
  #   Response: SSE stream with same event types as ActionCable
  #
  # The frontend useAgentChat() hook will automatically use this when
  # ActionCable connection fails.
  #
  class AgentController < ApplicationController
    before_action :authenticate_user!
    include ActionController::Live

    # POST /api/agent/chat — SSE streaming endpoint
    def chat
      conversation = current_user.conversations.find(params[:conversation_id])
      content = params[:content]

      unless content.present?
        render json: { error: "content is required" }, status: :unprocessable_entity
        return
      end

      # Set SSE headers
      response.headers["Content-Type"] = "text/event-stream"
      response.headers["Cache-Control"] = "no-cache"
      response.headers["X-Accel-Buffering"] = "no" # Disable nginx buffering
      response.headers["Connection"] = "keep-alive"

      # Persist user message
      user_msg = conversation.messages.create!(role: "user", content: content)

      sse_write("message", {
        id: user_msg.id, role: "user", content: content,
        created_at: user_msg.created_at.iso8601
      })

      # Stream LLM response
      agent_service = AgentService.new(conversation, tools: params[:tools])
      round = 0

      loop do
        round += 1
        result = agent_service.stream_response do |event|
          sse_write(event[:type], event[:data])
        end

        if result[:finish_reason] == "tool_calls" && round < AgentStreamJob::MAX_TOOL_ROUNDS
          execute_tool_calls_inline(conversation, result[:tool_calls])
          next
        end

        sse_write("done", {
          finish_reason: result[:finish_reason],
          usage: result[:usage],
          round: round
        })
        break
      end

    rescue ActionController::Live::ClientDisconnected
      Rails.logger.info("[AgentController] Client disconnected")
    rescue StandardError => e
      Rails.logger.error("[AgentController] Error: #{e.message}")
      sse_write("error", { message: e.message })
    ensure
      response.stream.close
    end

    private

    def sse_write(event_type, data)
      response.stream.write("event: #{event_type}\ndata: #{data.to_json}\n\n")
    end

    def execute_tool_calls_inline(conversation, tool_calls)
      return unless tool_calls.is_a?(Array)

      tool_calls.each do |tc|
        result = ToolExecutor.execute(
          name: tc["function"]["name"],
          arguments: tc["function"]["arguments"],
          conversation: conversation
        )

        tool_msg = conversation.messages.create!(
          role: "tool",
          content: result.to_s,
          tool_call_id: tc["id"],
          name: tc["function"]["name"]
        )

        sse_write("tool_result", {
          id: tool_msg.id,
          tool_call_id: tc["id"],
          name: tc["function"]["name"],
          content: result.to_s
        })
      end
    end
  end
end
