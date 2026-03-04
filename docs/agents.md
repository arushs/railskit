# Agent Development Guide

Deep dive into building AI agents with RailsKit and RubyLLM.

---

## Concepts

| Concept | What It Is |
|---|---|
| **Agent** | A class wrapping an LLM with instructions, tools, and conversation context |
| **Tool** | A Ruby class the LLM can invoke (function calling) |
| **Chat** | A persisted conversation with message history, token tracking, cost tracking |

---

## Creating Agents

### Generator

```bash
bin/rails generate agent <Name>
```

Creates: agent class, test file, React chat page.

### Agent Class

```ruby
class CustomerSupportAgent < RubyLLM::Agent
  # Which model to use
  model "claude-sonnet-4"

  # System instructions
  instructions <<~PROMPT
    You are a customer support agent for #{RailsKit.config.app.name}.
    
    Rules:
    - Be concise and helpful
    - Look up the user's account before answering billing questions
    - Offer to escalate to a human if you can't resolve the issue
    - Never share internal system details
  PROMPT

  # Available tools
  tools LookupUser, SearchKnowledgeBase, CreateTicket, EscalateToHuman

  # Optional settings
  temperature 0.3        # 0.0 = deterministic, 1.0 = creative
  max_tokens 1024        # Cap response length
end
```

### Dynamic Instructions

```ruby
class PersonalizedAgent < RubyLLM::Agent
  model "gpt-4o"

  def instructions
    <<~PROMPT
      You are a personal assistant for #{current_user.name}.
      Their plan: #{current_user.plan.name}.
      Their timezone: #{current_user.timezone}.
    PROMPT
  end

  tools CalendarLookup, TaskCreate
end
```

### Per-Agent Model Selection

```ruby
class QuickAnswerAgent < RubyLLM::Agent
  model "gpt-4o-mini"       # Fast + cheap for simple Q&A
end

class CodeReviewAgent < RubyLLM::Agent
  model "claude-sonnet-4"   # Best for code analysis
end

class CreativeAgent < RubyLLM::Agent
  model "gemini-2.0-flash"  # Good for creative tasks
  temperature 0.8
end
```

---

## Creating Tools

### Generator

```bash
bin/rails generate tool <Name>
```

### Tool Class

```ruby
class CreateTicket < RubyLLM::Tool
  description "Create a support ticket for issues that need human follow-up"

  param :subject, desc: "Brief description of the issue", required: true
  param :priority, desc: "Ticket priority: low, medium, high", required: true
  param :details, desc: "Full details of the issue"
  param :user_email, desc: "Email of the affected user"

  def execute(subject:, priority:, details: nil, user_email: nil)
    user = User.find_by(email: user_email) if user_email

    ticket = SupportTicket.create!(
      subject: subject,
      priority: priority,
      details: details,
      user: user,
      source: "ai_agent"
    )

    {
      ticket_id: ticket.id,
      status: "created",
      message: "Ticket ##{ticket.id} created."
    }
  end
end
```

### Error Handling

Return errors as data — the LLM interprets them for the user:

```ruby
class TransferFunds < RubyLLM::Tool
  description "Transfer funds between accounts"

  param :from_account, desc: "Source account ID"
  param :to_account, desc: "Destination account ID"
  param :amount, desc: "Amount in cents"

  def execute(from_account:, to_account:, amount:)
    source = Account.find_by(id: from_account)
    return { error: "Source account not found" } unless source

    if source.balance_cents < amount.to_i
      return { error: "Insufficient funds. Balance: #{source.balance_cents}" }
    end

    transfer = TransferService.execute(source, dest, amount.to_i)
    { success: true, transfer_id: transfer.id }
  rescue => e
    { error: "Transfer failed: #{e.message}" }
  end
end
```

---

## Streaming Responses

### Server Side (ActionCable)

```ruby
# api/app/channels/agent_channel.rb
class AgentChannel < ApplicationCable::Channel
  def subscribed
    stream_for current_user
  end

  def receive(data)
    chat = current_user.chats.find(data["chat_id"])

    chat.ask(data["message"]) do |chunk|
      AgentChannel.broadcast_to(current_user, {
        type: "chunk",
        chat_id: chat.id,
        content: chunk.content
      })
    end

    AgentChannel.broadcast_to(current_user, {
      type: "done",
      chat_id: chat.id
    })
  end
end
```

### Client Side (React)

```tsx
import { useAgent } from '@/hooks/useAgent';

function ChatPage({ chatId }: { chatId: string }) {
  const { messages, send, streaming } = useAgent(chatId);

  return (
    <div>
      {messages.map(msg => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
      {streaming && <TypingIndicator />}
      <ChatInput onSend={send} disabled={streaming} />
    </div>
  );
}
```

The `useAgent` hook handles ActionCable subscription, chunk appending, message history from the API, and optimistic UI updates.

---

## Cost Tracking

RubyLLM tracks token usage automatically. RailsKit adds a dashboard at `/dashboard/agents`.

### Dashboard Shows

- **Total spend** — daily, weekly, monthly
- **Per-agent breakdown** — which agents cost the most
- **Per-model breakdown** — cost by model
- **Per-conversation** — find expensive conversations
- **Tool usage** — which tools are called most, success/failure rates

### Programmatic Access

```ruby
chat.total_cost           # => 0.0342 (dollars)
chat.total_input_tokens   # => 1523
chat.total_output_tokens  # => 847

# Aggregate
Chat.where(agent_class: "CustomerSupportAgent")
    .where(created_at: Date.today.all_day)
    .sum(:total_cost)    # => 12.47
```

### Cost Alerts

```yaml
# railskit.yml
ai:
  cost_tracking:
    enabled: true
    alert_threshold: 50.00  # Daily spend alert ($)
```

---

## Testing

### Agent Tests

```ruby
class HelpDeskAgentTest < ActiveSupport::TestCase
  test "responds to greeting" do
    chat = Chat.create!(agent_class: "HelpDeskAgent")
    response = chat.ask("Hello!")

    assert response.content.present?
  end

  test "uses LookupUser tool when asked about account" do
    user = users(:john)
    chat = Chat.create!(agent_class: "HelpDeskAgent")

    response = chat.ask("Look up #{user.email}")

    assert chat.messages.any? { |m| m.tool_call? && m.tool_name == "LookupUser" }
  end
end
```

### Tool Tests

```ruby
class LookupUserTest < ActiveSupport::TestCase
  test "finds user by email" do
    user = users(:john)
    result = LookupUser.new.execute(email: user.email)

    assert_equal user.name, result[:name]
  end

  test "returns error for unknown email" do
    result = LookupUser.new.execute(email: "nobody@example.com")
    assert result[:error].present?
  end
end
```

---

## Advanced Patterns

### Structured Output

```ruby
class SentimentAnalyzer < RubyLLM::Agent
  model "gpt-4o-mini"
  instructions "Analyze the sentiment of the given text."

  output_schema do
    string :sentiment, desc: "positive, negative, or neutral"
    float :confidence, desc: "Confidence score 0.0 to 1.0"
    string :reasoning, desc: "Brief explanation"
  end
end

result = SentimentAnalyzer.ask("I love this product!")
result.sentiment   # => "positive"
result.confidence  # => 0.95
```

### Agent-to-Agent Routing (v2)

```ruby
class TriageAgent < RubyLLM::Agent
  model "gpt-4o-mini"  # Fast + cheap for routing

  instructions "Route to: billing, technical, or general"

  output_schema do
    string :route, desc: "billing, technical, or general"
  end
end

# In your controller:
triage = TriageAgent.ask(user_message)
agent_class = { "billing" => BillingAgent, "technical" => TechnicalAgent }
  .fetch(triage.route, GeneralAgent)
```

### Rate Limiting

```ruby
before_action :check_agent_rate_limit

def check_agent_rate_limit
  key = "agent_rate:#{current_user.id}"
  count = Rails.cache.increment(key, 1, expires_in: 1.hour)
  max = current_user.plan.features[:agent_requests_per_hour] || 20

  if count > max
    render json: { error: "Rate limit exceeded" }, status: 429
  end
end
```
