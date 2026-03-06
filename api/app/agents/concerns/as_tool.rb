# frozen_string_literal: true

# AsTool wraps any agent class as a RubyLLM-compatible tool.
#
# Include this in an agent, then declare tool metadata:
#
#   class BillingAgent
#     include AsTool
#
#     tool_name "billing_agent"
#     tool_description "Handles billing questions, refunds, and invoice lookups."
#     tool_param :message, type: :string, desc: "The user's billing question", required: true
#
#     SYSTEM_PROMPT = "You are a billing specialist..."
#     # ... rest of agent
#   end
#
# Then in an orchestrator:
#
#   @llm_chat.with_tool(BillingAgent.to_tool)
#
module AsTool
  extend ActiveSupport::Concern

  included do
    class_attribute :_tool_name, :_tool_description, :_tool_params, instance_writer: false
    self._tool_params = []
  end

  class_methods do
    def tool_name(name = nil)
      name ? self._tool_name = name.to_s : _tool_name || self.name.underscore
    end

    def tool_description(desc = nil)
      desc ? self._tool_description = desc : _tool_description || "Delegates to #{name}"
    end

    def tool_param(name, type: :string, desc: "", required: false)
      self._tool_params = _tool_params + [{ name: name, type: type, desc: desc, required: required }]
    end

    # Build a dynamic RubyLLM::Tool subclass that delegates execution to this agent.
    def to_tool(conversation: nil, context: {})
      agent_class = self
      tool_meta = {
        name: tool_name,
        description: tool_description,
        params: _tool_params
      }

      Class.new(RubyLLM::Tool) do
        description tool_meta[:description]

        tool_meta[:params].each do |p|
          param p[:name], type: p[:type], desc: p[:desc], required: p[:required]
        end

        define_method(:execute) do |**kwargs|
          message = kwargs[:message] || kwargs.values.first
          agent = agent_class.new(conversation: conversation, **context)
          response = agent.ask(message)
          content = response.respond_to?(:content) ? response.content : response.to_s

          {
            agent: tool_meta[:name],
            response: content
          }
        end
      end
    end
  end
end
