# frozen_string_literal: true

# CustomerSupportWorkflow demonstrates multi-agent orchestration.
#
# Flow:
#   1. Triage — classify the intent using AgentRouter
#   2. Route — dispatch to the matched specialist agent
#   3. Quality check — verify the response is helpful
#   4. Respond — format and return the final response
#
# Usage:
#   result = CustomerSupportWorkflow.run(
#     message: "I want a refund for my last payment",
#     conversation: chat
#   )
#   result[:final_response]  # => "I've looked into your refund..."
#   result[:routed_to]       # => "BillingAgent"
#   result[:_steps_executed] # => [:triage, :route, :quality_check, :respond]
#
class CustomerSupportWorkflow < BaseWorkflow
  # Step 1: Classify the user's intent using keyword routing
  step :triage do |ctx|
    message = ctx[:message]
    agent_class = AgentRouter.route(message)

    if agent_class
      ctx[:routed_to] = agent_class.name
      ctx[:agent_class] = agent_class
    else
      # Default to HelpDeskAgent for unclassified messages
      ctx[:routed_to] = "HelpDeskAgent"
      ctx[:agent_class] = HelpDeskAgent
    end
  end

  # Step 2: Dispatch to the specialist agent
  step :route do |ctx|
    agent = ctx[:agent_class].new(conversation: ctx[:conversation])
    response = agent.ask(ctx[:message])
    ctx[:agent_response] = response.respond_to?(:content) ? response.content : response.to_s
    ctx[:agent_instance] = agent
  end

  # Step 3: Quality check — verify the response isn't empty or an error
  step :quality_check, on_error: :skip do |ctx|
    response = ctx[:agent_response]

    if response.blank?
      ctx[:quality] = :empty
      ctx[:needs_fallback] = true
    elsif response.length < 10
      ctx[:quality] = :too_short
      ctx[:needs_fallback] = true
    else
      ctx[:quality] = :ok
      ctx[:needs_fallback] = false
    end
  end

  # Step 3b: Fallback if quality check flagged an issue
  step :fallback, if: ->(ctx) { ctx[:needs_fallback] } do |ctx|
    fallback_agent = HelpDeskAgent.new(conversation: ctx[:conversation])
    response = fallback_agent.ask(
      "The previous agent couldn't help with this: #{ctx[:message]}. Please assist."
    )
    ctx[:agent_response] = response.respond_to?(:content) ? response.content : response.to_s
    ctx[:routed_to] = "HelpDeskAgent (fallback)"
  end

  # Step 4: Format the final response
  step :respond do |ctx|
    ctx[:final_response] = ctx[:agent_response]
    ctx[:metadata] = {
      routed_to: ctx[:routed_to],
      quality: ctx[:quality],
      steps: ctx[:_steps_executed],
      duration_ms: ((Time.current - ctx[:_started_at]) * 1000).round
    }
  end
end
