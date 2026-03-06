# frozen_string_literal: true

# AgentRouter selects the best agent for a given message based on declared capabilities.
#
# Register agents with capability tags:
#
#   AgentRouter.register(BillingAgent,  capabilities: %w[billing payments invoices refunds])
#   AgentRouter.register(HelpDeskAgent, capabilities: %w[support tickets faq general])
#   AgentRouter.register(OrderAgent,    capabilities: %w[orders shipping tracking])
#
# Route a message:
#
#   agent_class = AgentRouter.route("Where's my refund?")
#   # => BillingAgent (matched on "refund")
#
# Or use the LLM-powered router for ambiguous queries:
#
#   agent_class = AgentRouter.smart_route("Where's my refund?", model: "gpt-4o-mini")
#
class AgentRouter
  Registration = Data.define(:agent_class, :capabilities, :priority)

  class << self
    def registry
      @registry ||= []
    end

    def register(agent_class, capabilities:, priority: 0)
      registry << Registration.new(
        agent_class: agent_class,
        capabilities: capabilities.map(&:downcase),
        priority: priority
      )
    end

    def reset!
      @registry = []
    end

    # Keyword-based routing: scores each agent by how many capability keywords
    # appear in the message. Ties broken by priority. Returns nil if no match.
    def route(message, threshold: 1)
      return nil if registry.empty?

      words = message.downcase.split(/\W+/).to_set
      scored = registry.map do |reg|
        hits = reg.capabilities.count { |cap| words.any? { |w| w.include?(cap) || cap.include?(w) } }
        [reg, hits]
      end

      best = scored
        .select { |_, hits| hits >= threshold }
        .max_by { |reg, hits| [hits, reg.priority] }

      best&.first&.agent_class
    end

    # LLM-powered routing for ambiguous queries. Asks a fast model to pick
    # the best agent from the registry. Falls back to keyword routing.
    def smart_route(message, model: "gpt-4o-mini")
      return route(message, threshold: 0) if registry.size <= 1

      options = registry.map.with_index do |reg, i|
        "#{i}: #{reg.agent_class.name} — #{reg.capabilities.join(', ')}"
      end.join("\n")

      prompt = <<~PROMPT
        Pick the best agent to handle this user message. Reply with ONLY the number.

        Agents:
        #{options}

        User message: "#{message}"

        Best agent number:
      PROMPT

      chat = RubyLLM.chat(model: model)
      response = chat.ask(prompt)
      index = response.content.strip.scan(/\d+/).first&.to_i

      if index && index < registry.size
        registry[index].agent_class
      else
        route(message, threshold: 0) # fallback
      end
    rescue StandardError => e
      Rails.logger.warn("[AgentRouter] smart_route failed: #{e.message}, falling back to keyword")
      route(message, threshold: 0)
    end

    # Convenience: route and instantiate
    def dispatch(message, conversation: nil, **kwargs)
      agent_class = route(message) || registry.first&.agent_class
      raise "No agents registered" unless agent_class

      agent = agent_class.new(conversation: conversation, **kwargs)
      { agent: agent, agent_class: agent_class }
    end
  end
end
