# RailsKit Agents v2 — Multi-Agent Orchestration

## Overview

RailsKit v2 adds three primitives for building multi-agent systems:

1. **Agent-as-Tool** (`AsTool`) — Wrap any agent as a tool callable by other agents
2. **Capability Router** (`AgentRouter`) — Route messages to the right specialist agent
3. **Handoff** (`Handoff`) — Transfer conversations between agents with context preservation

Plus a **Workflow DSL** (`BaseWorkflow`) for composing multi-step agent pipelines.

## Agent-as-Tool

Any agent can be wrapped as a RubyLLM tool, allowing an orchestrator agent to delegate sub-tasks:

```ruby
class BillingAgent
  include AsTool

  tool_name "billing"
  tool_description "Handles billing questions, refunds, and invoices."
  tool_param :message, type: :string, desc: "The billing question", required: true

  # ... agent implementation
end

# In your orchestrator agent:
class OrchestratorAgent
  def initialize(conversation:)
    @llm_chat = RubyLLM.chat(model: "gpt-4o")
    @llm_chat.with_tool(BillingAgent.to_tool(conversation: conversation))
    @llm_chat.with_tool(HelpDeskAgent.to_tool(conversation: conversation))
  end
end
```

When the LLM decides to use the `billing` tool, it instantiates a `BillingAgent`, calls `.ask()`, and returns the response.

## Capability Router

Route incoming messages to the best agent based on keyword matching or LLM-powered classification:

```ruby
# config/initializers/agent_router.rb
AgentRouter.register(HelpDeskAgent,
  capabilities: %w[support tickets faq help],
  priority: 0)

AgentRouter.register(BillingAgent,
  capabilities: %w[billing payments invoices refunds],
  priority: 1)

# Usage
AgentRouter.route("I need a refund")        # => BillingAgent
AgentRouter.route("How do I reset my password?")  # => HelpDeskAgent

# Or dispatch directly
result = AgentRouter.dispatch("refund please", conversation: chat)
result[:agent].ask("refund please")

# LLM-powered routing for ambiguous queries
AgentRouter.smart_route("my account has issues", model: "gpt-4o-mini")
```

### API Endpoint

```
POST /api/agents/route
{ "message": "I need a refund", "conversation_id": "optional-id" }
```

The server auto-routes to the best agent and returns the response with `routed_to` metadata.

## Handoff

Transfer a conversation from one agent to another, preserving full history:

```ruby
class TriageAgent
  include Handoff

  def process(message)
    response = ask(message)

    if response.content.include?("billing")
      # Hand off to BillingAgent — conversation history preserved
      hand_off_to(BillingAgent,
        reason: "User needs billing assistance",
        message: message,       # immediately process with new agent
        summarize: true)        # prepend conversation summary
    else
      response
    end
  end
end
```

Options:
- `reason:` — logged as a system message in the conversation
- `message:` — if provided, the new agent processes it immediately
- `summarize:` — prepends a conversation summary for context
- `context:` — extra kwargs passed to the new agent's constructor

## Workflows

For complex multi-step orchestration, use the workflow DSL:

```ruby
class CustomerSupportWorkflow < BaseWorkflow
  step :triage do |ctx|
    ctx[:agent_class] = AgentRouter.route(ctx[:message]) || HelpDeskAgent
  end

  step :route do |ctx|
    agent = ctx[:agent_class].new(conversation: ctx[:conversation])
    ctx[:response] = agent.ask(ctx[:message])
  end

  step :quality_check, on_error: :skip do |ctx|
    ctx[:needs_fallback] = ctx[:response].content.blank?
  end

  step :fallback, if: ->(ctx) { ctx[:needs_fallback] } do |ctx|
    agent = HelpDeskAgent.new(conversation: ctx[:conversation])
    ctx[:response] = agent.ask(ctx[:message])
  end
end

# Execute
result = CustomerSupportWorkflow.run(message: "refund please", conversation: chat)
result[:response]          # => agent response
result[:_steps_executed]   # => [:triage, :route, :quality_check]
result[:_duration_ms]      # => 1234
```

### Step Options

| Option | Values | Description |
|--------|--------|-------------|
| `if:` | Lambda | Step runs only when condition is truthy |
| `on_error:` | `:halt`, `:skip`, `:retry`, Proc | Error handling strategy |

### Generator

```bash
rails generate railskit:workflow onboarding triage route respond --agents TriageAgent HelpDeskAgent
```

Generates `app/workflows/onboarding_workflow.rb` and `spec/workflows/onboarding_workflow_spec.rb`.

## Architecture

```
┌─────────────┐     ┌──────────────┐
│  Controller  │────▶│ AgentRouter  │──▶ best agent
└─────────────┘     └──────────────┘
                          │
       ┌──────────────────┼──────────────────┐
       ▼                  ▼                  ▼
  BillingAgent      HelpDeskAgent      OrderAgent
  (include AsTool)  (include AsTool)   (include AsTool)
  (include Handoff) (include Handoff)  (include Handoff)
       │
       ▼ hand_off_to(EscalationAgent)
  EscalationAgent
```

Workflows compose these primitives into repeatable pipelines:

```
BaseWorkflow
  └── CustomerSupportWorkflow
        step :triage     → AgentRouter.route()
        step :route      → agent.ask()
        step :quality    → validate response
        step :fallback   → HelpDeskAgent (if needed)
        step :respond    → format output
```
