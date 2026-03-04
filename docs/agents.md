# Agent Development Guide

Deep dive into building AI agents with RailsKit and RubyLLM.

---

## Agent Architecture

Agents are plain Ruby classes in `app/agents/`. They're not subclasses of a framework base class — they're regular objects that compose RubyLLM's `chat` interface.

---

## Creating Agents

### Generator

```bash
cd api
bin/rails generate agent <Name>
```

Creates three files:

```
api/app/agents/<name>_agent.rb                 # Agent class
api/test/agents/<name>_agent_test.rb           # Test file
web/src/pages/agents/<Name>.tsx                # React chat page
```

The generator also wires up the API endpoint and React route.

### Agent Class

```ruby
# api/app/agents/customer_support_agent.rb
class CustomerSupportAgent < RubyLLM::Agent
  # Which model to use (any RubyLLM-supported model)
  model "claude-sonnet-4"

  # System instructions — what the agent knows and how it behaves
  instructions <<~PROMPT
    You are a customer support agent for #{RailsKit.config.app.name}.
    
    Rules:
    - Be concise and helpful
    - Look up the user's account before answering billing questions
    - Offer to escalate to a human if you can't resolve the issue
    - Never share internal system details
  PROMPT

  # Tools the agent can call
  tools LookupUser, SearchKnowledgeBase, CreateTicket, EscalateToHuman

  # Optional settings
  temperature 0.3        # 0.0 = deterministic, 1.0 = creative
  max_tokens 1024        # Cap response length
end
```

### Dynamic Instructions

Instructions can use instance methods for per-user personalization:

```ruby
class PersonalizedAgent < RubyLLM::Agent
  model "gpt-4o"

  def instructions
    <<~PROMPT
      You are a personal assistant for #{current_user.name}.
      Their plan: #{current_user.plan.name}.
      Their timezone: #{current_user.timezone}.
      Today is #{Date.today.strftime("%B %d, %Y")}.
    PROMPT
  end

  def ask(message)
    response = @llm_chat.ask(message)
    @conversation&.persist_exchange(user_content: message, response: response)
    response
  end

  def stream(message, &block)
    @llm_chat.ask(message, &block)
  end

  private

  def register_tools
    @llm_chat.with_tool(TicketLookupTool)
    @llm_chat.with_tool(KnowledgeSearchTool)
    @llm_chat.with_tool(OrderStatusTool)
  end
end
```

### Choosing Models per Agent

Different agents can use different models — pick based on the task:

| Pattern | Method | Description |
|---|---|---|
| Initialize | `RubyLLM.chat(model:)` | Creates a new chat instance with the specified model |
| Resume | `conversation.to_llm_chat(model:)` | Reconstructs chat from persisted messages |
| Instructions | `.with_instructions(text)` | Sets the system prompt |
| Tools | `.with_tool(ToolClass)` | Registers a tool the LLM can call |
| Ask | `.ask(message)` | Sends message, returns response (blocks until complete) |
| Stream | `.ask(message, &block)` | Streams response, yielding chunks to the block |

### Model Selection

The default model comes from `railskit.yml`:
```yaml
ai:
  provider: "openai"
  model: "gpt-4o"
```

Override per-agent or per-request:
```ruby
class QuickAnswerAgent < RubyLLM::Agent
  model "gpt-4o-mini"           # Fast + cheap for simple Q&A
end

class CodeReviewAgent < RubyLLM::Agent
  model "claude-sonnet-4"       # Best for code analysis
end

class CreativeAgent < RubyLLM::Agent
  model "gemini-2.0-flash"      # Good for creative tasks
  temperature 0.8
end

class LocalAgent < RubyLLM::Agent
  model "llama3.2"              # Ollama — runs locally, no API cost
end
```

---

## Tools

Tools give agents the ability to take action — query databases, call APIs, create records, send emails.

### Generator

```bash
cd api
bin/rails generate tool <Name>
```

Creates `api/app/tools/<name>.rb`.

### Tool Structure

```ruby
# api/app/tools/create_ticket.rb
class CreateTicket < RubyLLM::Tool
  # Description tells the LLM when to use this tool
  description "Create a support ticket for issues that need human follow-up"

  # Parameters the LLM must provide
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

    # Return data — the LLM interprets this for the user
    {
      city: city,
      temperature: response.temperature,
      conditions: response.conditions,
      units: units
    }
  end
end
```

### Parameter Types

Return errors as data — the LLM will interpret them for the user in natural language:

### Built-in Example Tools

RailsKit ships with three example tools in `app/tools/`:

**TicketLookupTool** — looks up support tickets by ID:
```ruby
class TicketLookupTool < RubyLLM::Tool
  description "Look up a support ticket by its ID to get status, subject, and details."
  param :ticket_id, type: :string, desc: "The ticket ID (e.g. TKT-1234)", required: true

  param :from_account, desc: "Source account ID", required: true
  param :to_account, desc: "Destination account ID", required: true
  param :amount, desc: "Amount in cents", required: true

  def execute(from_account:, to_account:, amount:)
    source = Account.find_by(id: from_account)
    return { error: "Source account not found" } unless source

    if source.balance_cents < amount.to_i
      return { error: "Insufficient funds. Balance: #{source.balance_cents}" }
    end

    transfer = TransferService.execute(source, to_account, amount.to_i)
    { success: true, transfer_id: transfer.id }
  rescue => e
    { error: "Transfer failed: #{e.message}" }
  end
end
```

### Tool Tips

- **Clear descriptions matter.** The LLM decides when to use a tool based on its `description`. Be specific: "Look up a user's account details by email" beats "User lookup."
- **Required vs optional params.** Mark params `required: true` when the LLM must always provide them. Optional params let the LLM skip them when not relevant.
- **Return structured data.** Hashes work best. The LLM converts your data into a natural language response.
- **Keep tools focused.** One tool, one job. Don't build a mega-tool that does everything.

---

## Streaming

RailsKit streams agent responses in real-time via ActionCable (WebSockets). Users see text appear as the LLM generates it.

### Server: ActionCable Channel

1. Client POSTs to `/api/agents/:name/stream`
2. `AgentsController#stream_chat` persists the user message and enqueues `AgentStreamJob`
3. `AgentStreamJob` calls `agent.stream(message)` with a block
4. RubyLLM yields each token chunk to the block
5. The block broadcasts via `AgentChatChannel.broadcast_to(conversation, ...)`
6. The React `useAgentStream` hook receives tokens via ActionCable WebSocket

### ActionCable Protocol

    # Stream chunks as they arrive from the LLM
    chat.ask(data["message"]) do |chunk|
      AgentChannel.broadcast_to(current_user, {
        type: "chunk",
        chat_id: chat.id,
        content: chunk.content
      })
    end

    # Signal completion
    AgentChannel.broadcast_to(current_user, {
      type: "done",
      chat_id: chat.id
    })
  end
end
```

### Client: React Hook

```tsx
import { useAgent } from '@/hooks/useAgent';

function ChatPage({ chatId }: { chatId: string }) {
  const { messages, send, streaming } = useAgent(chatId);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {streaming && <TypingIndicator />}
      </div>
      <ChatInput onSend={send} disabled={streaming} />
    </div>
  );
}

// Error
{ "type": "stream_error", "error": "Something went wrong.", "conversation_id": "..." }
```

The `useAgent` hook handles:
- ActionCable subscription and cleanup
- Chunk appending into the current message
- Message history loading from the API
- Optimistic UI updates (user message appears instantly)
- Streaming state (`streaming: true/false`)

### How Streaming Works End-to-End

```
1. User types message → React calls send()
2. useAgent sends via ActionCable WebSocket
3. AgentChannel.receive() loads the Chat
4. chat.ask() calls the LLM provider
5. Provider streams response tokens
6. Each chunk → broadcast_to via ActionCable
7. useAgent receives chunk → appends to message
8. React re-renders with new text
9. "done" event → streaming = false
```

```bash
# .env — add the API key
ANTHROPIC_API_KEY=sk-ant-...
```

## Structured Output

Force the LLM to return a specific data shape — useful for classification, extraction, and routing.

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

# Usage
result = SentimentAnalyzer.ask("I love this product!")
result.sentiment   # => "positive"
result.confidence  # => 0.95
result.reasoning   # => "Strong positive language ('love') with no qualifiers"
```

### Practical Patterns

**Classification / Routing:**

```ruby
class TriageAgent < RubyLLM::Agent
  model "gpt-4o-mini"  # Fast + cheap for routing decisions

  instructions <<~PROMPT
    Classify the user's message into one category.
    Route to: billing, technical, or general.
  PROMPT

  output_schema do
    string :route, desc: "billing, technical, or general"
    string :confidence, desc: "high, medium, or low"
  end
end

# In your controller — route to the right agent:
triage = TriageAgent.ask(user_message)
agent_class = {
  "billing"   => BillingAgent,
  "technical" => TechnicalAgent
}.fetch(triage.route, GeneralAgent)

response = agent_class.ask(user_message)
```

**Data Extraction:**

```ruby
class InvoiceParser < RubyLLM::Agent
  model "gpt-4o"
  instructions "Extract invoice details from the provided text."

  output_schema do
    string :vendor, desc: "Company name on the invoice"
    string :date, desc: "Invoice date in YYYY-MM-DD format"
    float :total, desc: "Total amount in dollars"
    array :line_items do
      string :description
      float :amount
    end
  end
end

result = InvoiceParser.ask("Invoice from Acme Corp, Jan 15 2025. Widget x3 $30, Service fee $10. Total: $40.")
result.vendor      # => "Acme Corp"
result.total       # => 40.0
result.line_items  # => [{ description: "Widget x3", amount: 30.0 }, ...]
```

---

## Cost Tracking

RubyLLM tracks token usage automatically. RailsKit adds a dashboard at `/dashboard/agents`.

### What the Dashboard Shows

- **Total spend** — daily, weekly, monthly aggregations
- **Per-agent breakdown** — which agents cost the most
- **Per-model breakdown** — cost by model
- **Per-conversation** — find expensive conversations
- **Tool usage** — which tools are called most, success/failure rates

### Programmatic Access

```ruby
# Per-conversation
chat.total_cost           # => 0.0342 (dollars)
chat.total_input_tokens   # => 1523
chat.total_output_tokens  # => 847

# Aggregate queries
Chat.where(agent_class: "CustomerSupportAgent")
    .where(created_at: Date.today.all_day)
    .sum(:total_cost)    # => 12.47

# Per-model
Chat.group(:model).sum(:total_cost)
# => { "claude-sonnet-4" => 8.23, "gpt-4o-mini" => 1.04 }
```

### Cost Alerts

```yaml
# railskit.yml
ai:
  cost_tracking:
    enabled: true
    alert_threshold: 50.00  # Alert when daily spend exceeds this ($)
```

When the threshold is hit, RailsKit sends an email to `app.support_email`.

### Cost Optimization Tips

| Strategy | Impact | How |
|---|---|---|
| Use `gpt-4o-mini` for routing/classification | 10-50x cheaper | Match model to task complexity |
| Cache FAQ responses | Eliminates repeated calls | `Rails.cache.fetch` with message hash |
| Set `max_tokens` | Prevents runaway responses | `max_tokens 500` in agent class |
| Monitor the dashboard | Catch cost spikes early | Check `/dashboard/agents` weekly |

---

## Testing

### Agent Tests

```ruby
# api/test/agents/help_desk_agent_test.rb
class HelpDeskAgentTest < ActiveSupport::TestCase
  test "responds to greeting" do
    chat = Chat.create!(agent_class: "HelpDeskAgent")
    response = chat.ask("Hello!")

    assert response.content.present?
  end

  test "uses LookupUser tool when asked about account" do
    user = users(:john)
    chat = Chat.create!(agent_class: "HelpDeskAgent")

    response = chat.ask("Look up the account for #{user.email}")

    assert chat.messages.any? { |m| m.tool_call? && m.tool_name == "LookupUser" }
  end

  test "respects max_tokens setting" do
    chat = Chat.create!(agent_class: "ConciseAgent")
    response = chat.ask("Explain quantum computing in detail")

    # Response should be capped
    assert response.output_tokens <= 500
  end
end
```

### Tool Tests

Test tools in isolation — no LLM call needed:

```ruby
# api/test/tools/lookup_user_test.rb
class LookupUserTest < ActiveSupport::TestCase
  test "finds user by email" do
    user = users(:john)
    result = LookupUser.new.execute(email: user.email)

    assert_equal user.name, result[:name]
    assert_equal user.email, result[:email]
  end

  test "returns error for unknown email" do
    result = LookupUser.new.execute(email: "nobody@example.com")
    assert result[:error].present?
  end

  test "handles missing optional params" do
    result = CreateTicket.new.execute(
      subject: "Test",
      priority: "low"
      # details and user_email omitted
    )
    assert result[:ticket_id].present?
  end
end
```

### Testing Tips

- **Tool tests are fast** — no API calls, just Ruby. Test every edge case.
- **Agent tests hit the LLM** — use sparingly, focus on integration (does the agent call the right tool?).
- **Mock expensive tools** — stub external API calls in tool tests.
- **Use `VCR`** — record LLM API responses for deterministic agent tests.

---

## Advanced Patterns

### Agent-to-Agent Routing

Use a cheap, fast agent to classify input, then route to a specialized agent:

```ruby
# Triage (fast + cheap)
triage = TriageAgent.ask(user_message)

# Route to specialist
agent = case triage.route
        when "billing"   then BillingAgent
        when "technical" then TechnicalAgent
        else GeneralAgent
        end

# The specialist handles the actual conversation
response = agent.ask(user_message, chat: chat)
```

### Rate Limiting

Protect against runaway agent usage per user:

```ruby
# api/app/controllers/concerns/agent_rate_limited.rb
module AgentRateLimited
  extend ActiveSupport::Concern

  included do
    before_action :check_agent_rate_limit, only: [:chat]
  end

  private

  def check_agent_rate_limit
    key = "agent_rate:#{current_user.id}"
    count = Rails.cache.increment(key, 1, expires_in: 1.hour)
    max = current_user.plan.features[:agent_requests_per_hour] || 20

    if count > max
      render json: { error: "Rate limit exceeded. Upgrade your plan for more requests." },
             status: :too_many_requests
    end
  end
end
```

### Conversation Context Window

For long conversations, manage context to control costs:

```ruby
class LongConversationAgent < RubyLLM::Agent
  model "gpt-4o"

  # Only send the last N messages to the LLM
  context_window 20  # Last 20 messages

  instructions <<~PROMPT
    You are a research assistant. You may be in a long conversation.
    If the user references something from earlier that you can't see,
    ask them to repeat the relevant details.
  PROMPT
end
```

### Multi-Model Pipelines

Chain different models for different phases:

```ruby
class ResearchPipeline
  def self.run(query)
    # Step 1: Fast model generates search queries
    searches = SearchQueryAgent.ask(query)  # gpt-4o-mini

    # Step 2: Execute searches
    results = searches.queries.map { |q| SearchService.search(q) }

    # Step 3: Powerful model synthesizes results
    synthesis = SynthesisAgent.ask(
      "Based on these results, answer: #{query}\n\nResults:\n#{results.to_json}"
    )  # claude-sonnet-4

    synthesis
  end
end
```

---

## Quick Reference

### Generator Commands

```bash
bin/rails generate agent <Name>        # Agent + test + React page
bin/rails generate tool <Name>         # Tool class
```

### Agent Config Options

```ruby
class MyAgent < RubyLLM::Agent
  model "claude-sonnet-4"              # Required: which LLM
  instructions "..."                    # Required: system prompt
  tools Tool1, Tool2                    # Optional: available tools
  temperature 0.3                       # Optional: 0.0-1.0 (default: model's default)
  max_tokens 1024                       # Optional: cap response length
  context_window 20                     # Optional: messages to include
end
```

### Tool Param Types

```ruby
param :name, desc: "Description", required: true    # String (default)
param :count, type: :integer, desc: "How many"      # Integer
param :active, type: :boolean, desc: "Is active"    # Boolean
param :tags, type: :array, desc: "List of tags"     # Array
```

### Console Quick Test

```bash
cd api && bin/rails console
```

```ruby
chat = Chat.create!(agent_class: "MyAgent")
response = chat.ask("Hello!")
puts response.content
puts "Cost: $#{chat.total_cost}"
```
