# frozen_string_literal: true

# AgentService handles LLM API calls with streaming support.
# Abstracts provider differences (OpenAI, Anthropic, Google) behind
# a unified streaming interface.
#
# Usage:
#   service = AgentService.new(chat, tools: [...])
#   result = service.stream_response do |event|
#     # event = { type: "chunk", data: { content: "..." } }
#     ActionCable.broadcast(...)
#   end
#
class AgentService
  PROVIDERS = {
    "openai" => :stream_openai,
    "anthropic" => :stream_anthropic,
    "google" => :stream_google
  }.freeze

  def initialize(chat, tools: nil)
    @chat = chat
    @tools = tools

    # Pull provider and model from config (Chat doesn't store these)
    ai_config = Rails.application.config.railskit.ai
    @provider = ai_config.provider
    @model = chat.model_id || ai_config.model
  end

  # Streams the response, yielding ActionCable-formatted events.
  # Returns { finish_reason:, tool_calls:, usage: }
  def stream_response(&block)
    method_name = PROVIDERS[@provider]
    raise "Unsupported provider: #{@provider}" unless method_name

    send(method_name, &block)
  end

  private

  def messages_payload
    @chat.message_history
  end

  # ── OpenAI-compatible streaming (works with OpenAI, Azure, local) ──

  def stream_openai(&block)
    require "net/http"
    require "json"

    api_key = ENV.fetch("OPENAI_API_KEY")
    base_url = ENV.fetch("OPENAI_BASE_URL", "https://api.openai.com/v1")

    uri = URI("#{base_url}/chat/completions")
    body = {
      model: @model,
      messages: messages_payload,
      stream: true,
      stream_options: { include_usage: true }
    }
    body[:tools] = @tools if @tools.present?

    full_content = ""
    tool_calls_acc = {}
    finish_reason = nil
    usage = nil

    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = uri.scheme == "https"
    http.read_timeout = 120

    request = Net::HTTP::Post.new(uri)
    request["Authorization"] = "Bearer #{api_key}"
    request["Content-Type"] = "application/json"
    request.body = body.to_json

    http.request(request) do |response|
      raise "OpenAI API error: #{response.code} #{response.body}" unless response.code == "200"

      buffer = ""
      response.read_body do |chunk|
        buffer += chunk
        while (line_end = buffer.index("\n"))
          line = buffer.slice!(0..line_end).strip
          next if line.empty? || line == "data: [DONE]"
          next unless line.start_with?("data: ")

          data = JSON.parse(line.sub("data: ", ""))
          delta = data.dig("choices", 0, "delta") || {}
          choice_finish = data.dig("choices", 0, "finish_reason")

          # Content chunk
          if delta["content"]
            full_content += delta["content"]
            block.call({
              type: "chunk",
              data: { content: delta["content"], index: data.dig("choices", 0, "index") || 0 }
            })
          end

          # Tool call chunks (streamed incrementally)
          if delta["tool_calls"]
            delta["tool_calls"].each do |tc|
              idx = tc["index"]
              tool_calls_acc[idx] ||= { "id" => "", "type" => "function", "function" => { "name" => "", "arguments" => "" } }
              tool_calls_acc[idx]["id"] = tc["id"] if tc["id"]
              tool_calls_acc[idx]["function"]["name"] += tc.dig("function", "name") || ""
              tool_calls_acc[idx]["function"]["arguments"] += tc.dig("function", "arguments") || ""

              block.call({
                type: "tool_call_chunk",
                data: {
                  index: idx,
                  id: tool_calls_acc[idx]["id"],
                  name: tool_calls_acc[idx]["function"]["name"],
                  arguments_delta: tc.dig("function", "arguments") || ""
                }
              })
            end
          end

          finish_reason = choice_finish if choice_finish
          usage = data["usage"] if data["usage"]
        end
      end
    end

    # Persist assistant message
    tool_calls_final = tool_calls_acc.any? ? tool_calls_acc.values : nil
    assistant_msg = @chat.messages.create!(
      role: "assistant",
      content: full_content.presence,
      tool_calls: tool_calls_final,
      finish_reason: finish_reason,
      token_count: usage&.dig("total_tokens"),
      cost_cents: calculate_cost(usage)
    )

    # Broadcast completed message
    block.call({
      type: "message",
      data: {
        id: assistant_msg.id,
        role: "assistant",
        content: full_content,
        tool_calls: tool_calls_final,
        finish_reason: finish_reason,
        token_count: usage&.dig("total_tokens"),
        cost_cents: assistant_msg.cost_cents&.to_f,
        created_at: assistant_msg.created_at.iso8601
      }
    })

    # Broadcast individual tool_call events for complete tool calls
    if tool_calls_final
      tool_calls_final.each do |tc|
        block.call({
          type: "tool_call",
          data: {
            id: tc["id"],
            name: tc["function"]["name"],
            arguments: tc["function"]["arguments"]
          }
        })
      end
    end

    {
      finish_reason: tool_calls_final ? "tool_calls" : finish_reason,
      tool_calls: tool_calls_final,
      usage: usage
    }
  end

  # ── Anthropic streaming ──

  def stream_anthropic(&block)
    require "net/http"
    require "json"

    api_key = ENV.fetch("ANTHROPIC_API_KEY")

    uri = URI("https://api.anthropic.com/v1/messages")
    messages = messages_payload

    # Anthropic uses separate system param
    system_content = nil
    if messages.first&.dig(:role) == "system"
      system_content = messages.shift[:content]
    end

    body = {
      model: @model,
      messages: messages,
      max_tokens: 4096,
      stream: true
    }
    body[:system] = system_content if system_content
    body[:tools] = convert_tools_to_anthropic(@tools) if @tools.present?

    full_content = ""
    tool_calls = []
    current_tool = nil
    finish_reason = nil
    usage = {}

    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true
    http.read_timeout = 120

    request = Net::HTTP::Post.new(uri)
    request["x-api-key"] = api_key
    request["anthropic-version"] = "2023-06-01"
    request["Content-Type"] = "application/json"
    request.body = body.to_json

    http.request(request) do |response|
      raise "Anthropic API error: #{response.code} #{response.body}" unless response.code == "200"

      buffer = ""
      response.read_body do |chunk|
        buffer += chunk
        while (line_end = buffer.index("\n"))
          line = buffer.slice!(0..line_end).strip
          next if line.empty?
          next unless line.start_with?("data: ")

          data = JSON.parse(line.sub("data: ", ""))

          case data["type"]
          when "content_block_start"
            block_data = data["content_block"]
            if block_data["type"] == "tool_use"
              current_tool = {
                "id" => block_data["id"],
                "type" => "function",
                "function" => { "name" => block_data["name"], "arguments" => "" }
              }
            end

          when "content_block_delta"
            delta = data["delta"]
            if delta["type"] == "text_delta"
              full_content += delta["text"]
              block.call({ type: "chunk", data: { content: delta["text"], index: 0 } })
            elsif delta["type"] == "input_json_delta" && current_tool
              current_tool["function"]["arguments"] += delta["partial_json"]
              block.call({
                type: "tool_call_chunk",
                data: {
                  index: tool_calls.size,
                  id: current_tool["id"],
                  name: current_tool["function"]["name"],
                  arguments_delta: delta["partial_json"]
                }
              })
            elsif delta["type"] == "thinking_delta"
              block.call({ type: "thinking", data: { content: delta["thinking"] } })
            end

          when "content_block_stop"
            if current_tool
              tool_calls << current_tool
              block.call({
                type: "tool_call",
                data: {
                  id: current_tool["id"],
                  name: current_tool["function"]["name"],
                  arguments: current_tool["function"]["arguments"]
                }
              })
              current_tool = nil
            end

          when "message_delta"
            finish_reason = data.dig("delta", "stop_reason")
            usage.merge!(data["usage"] || {})

          when "message_start"
            usage.merge!(data.dig("message", "usage") || {})
          end
        end
      end
    end

    tool_calls_final = tool_calls.any? ? tool_calls : nil
    total_tokens = (usage["input_tokens"] || 0) + (usage["output_tokens"] || 0)

    assistant_msg = @chat.messages.create!(
      role: "assistant",
      content: full_content.presence,
      tool_calls: tool_calls_final,
      finish_reason: finish_reason,
      token_count: total_tokens,
      cost_cents: calculate_cost_anthropic(usage)
    )

    block.call({
      type: "message",
      data: {
        id: assistant_msg.id,
        role: "assistant",
        content: full_content,
        tool_calls: tool_calls_final,
        finish_reason: finish_reason,
        token_count: total_tokens,
        cost_cents: assistant_msg.cost_cents&.to_f,
        created_at: assistant_msg.created_at.iso8601
      }
    })

    {
      finish_reason: tool_calls_final ? "tool_calls" : finish_reason,
      tool_calls: tool_calls_final,
      usage: usage
    }
  end

  # ── Google Gemini streaming ──

  def stream_google(&block)
    require "net/http"
    require "json"

    api_key = ENV.fetch("GOOGLE_API_KEY")
    uri = URI("https://generativelanguage.googleapis.com/v1beta/models/#{@model}:streamGenerateContent?key=#{api_key}&alt=sse")

    messages = messages_payload
    system_instruction = nil
    if messages.first&.dig(:role) == "system"
      system_instruction = messages.shift[:content]
    end

    # Convert to Gemini format
    contents = messages.map do |m|
      {
        role: m[:role] == "assistant" ? "model" : "user",
        parts: [{ text: m[:content] }]
      }
    end

    body = { contents: contents }
    body[:system_instruction] = { parts: [{ text: system_instruction }] } if system_instruction

    full_content = ""
    usage = {}

    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true
    http.read_timeout = 120

    request = Net::HTTP::Post.new(uri)
    request["Content-Type"] = "application/json"
    request.body = body.to_json

    http.request(request) do |response|
      raise "Google API error: #{response.code} #{response.body}" unless response.code == "200"

      buffer = ""
      response.read_body do |chunk|
        buffer += chunk
        while (line_end = buffer.index("\n"))
          line = buffer.slice!(0..line_end).strip
          next if line.empty?
          next unless line.start_with?("data: ")

          data = JSON.parse(line.sub("data: ", ""))
          text = data.dig("candidates", 0, "content", "parts", 0, "text")

          if text
            full_content += text
            block.call({ type: "chunk", data: { content: text, index: 0 } })
          end

          if data["usageMetadata"]
            usage = {
              "prompt_tokens" => data["usageMetadata"]["promptTokenCount"],
              "completion_tokens" => data["usageMetadata"]["candidatesTokenCount"],
              "total_tokens" => data["usageMetadata"]["totalTokenCount"]
            }
          end
        end
      end
    end

    assistant_msg = @chat.messages.create!(
      role: "assistant",
      content: full_content.presence,
      finish_reason: "stop",
      token_count: usage["total_tokens"],
      cost_cents: 0 # Google pricing varies
    )

    block.call({
      type: "message",
      data: {
        id: assistant_msg.id,
        role: "assistant",
        content: full_content,
        finish_reason: "stop",
        token_count: usage["total_tokens"],
        created_at: assistant_msg.created_at.iso8601
      }
    })

    { finish_reason: "stop", tool_calls: nil, usage: usage }
  end

  # ── Cost calculation ──

  COST_PER_1K = {
    # OpenAI
    "gpt-4o" => { input: 0.25, output: 1.0 },
    "gpt-4o-mini" => { input: 0.015, output: 0.06 },
    "gpt-4-turbo" => { input: 1.0, output: 3.0 },
    "o1" => { input: 1.5, output: 6.0 },
    # Anthropic
    "claude-sonnet-4-20250514" => { input: 0.3, output: 1.5 },
    "claude-opus-4-20250514" => { input: 1.5, output: 7.5 },
    "claude-3-5-haiku-20241022" => { input: 0.08, output: 0.4 }
  }.freeze

  def calculate_cost(usage)
    return 0 unless usage
    rates = COST_PER_1K[@model] || { input: 0, output: 0 }
    input_cost = (usage["prompt_tokens"] || 0) / 1000.0 * rates[:input]
    output_cost = (usage["completion_tokens"] || 0) / 1000.0 * rates[:output]
    (input_cost + output_cost).round(4)
  end

  def calculate_cost_anthropic(usage)
    rates = COST_PER_1K[@model] || { input: 0, output: 0 }
    input_cost = (usage["input_tokens"] || 0) / 1000.0 * rates[:input]
    output_cost = (usage["output_tokens"] || 0) / 1000.0 * rates[:output]
    (input_cost + output_cost).round(4)
  end

  def convert_tools_to_anthropic(tools)
    return nil unless tools
    tools.map do |t|
      {
        name: t["function"]["name"],
        description: t["function"]["description"],
        input_schema: t["function"]["parameters"]
      }
    end
  end
end
