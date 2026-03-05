# frozen_string_literal: true

# ToolExecutor dispatches tool calls to registered handlers.
#
# Register tools by adding entries to the TOOLS hash:
#
#   ToolExecutor::TOOLS["get_weather"] = ->(args, chat) {
#     WeatherService.fetch(args["location"])
#   }
#
# Or define a class method:
#
#   class ToolExecutor
#     register_tool "get_weather" do |args, chat|
#       WeatherService.fetch(args["location"])
#     end
#   end
#
class ToolExecutor
  TOOLS = {}.freeze

  class << self
    def execute(name:, arguments:, chat:)
      args = arguments.is_a?(String) ? JSON.parse(arguments) : arguments
      handler = registered_tools[name]

      unless handler
        return JSON.generate({
          error: "Unknown tool: #{name}",
          available_tools: registered_tools.keys
        })
      end

      result = handler.call(args, chat)
      result.is_a?(String) ? result : JSON.generate(result)
    rescue JSON::ParserError => e
      JSON.generate({ error: "Invalid tool arguments: #{e.message}" })
    rescue StandardError => e
      Rails.logger.error("[ToolExecutor] #{name} failed: #{e.message}")
      JSON.generate({ error: "Tool execution failed: #{e.message}" })
    end

    def register_tool(name, &block)
      registered_tools[name] = block
    end

    def registered_tools
      @registered_tools ||= {}
    end
  end
end
