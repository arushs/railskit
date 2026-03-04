# Agent Development Guide

Deep dive into building AI agents with RailsKit and RubyLLM.

---

## Agent Architecture

Agents are plain Ruby classes in `app/agents/`. They're not subclasses of a framework base class — they're regular objects that compose RubyLLM's `chat` interface.

### Anatomy of an Agent

```ruby
class HelpDeskAgent
  include StructuredOutput  # optional — adds structured_ask method

  SYSTEM_PROMPT = <<~PROMPT
    You are a friendly help desk assistant.
    You can look up tickets, search the knowledge base, and check order status.
  PROMPT

  attr_reader :llm_chat, :conversation

  def initialize(conversation: nil, model: nil)
    @conversation = conversation
    @llm_chat = conversation ? conversation.to_llm_chat(model: model) : RubyLLM.chat(model: model)
    @llm_chat.with_instructions(SYSTEM_PROMPT)
    register_tools
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

### Key Patterns

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
# Per-agent default
agent = HelpDeskAgent.new(model: "claude-sonnet-4-20250514")

# The model is resolved by RubyLLM — it auto-detects the provider
# from the model name. No need to change railskit.yml.
```

---

## Tools

Tools extend `RubyLLM::Tool` and live in `app/tools/`.

### Generate a Tool

```bash
bin/rails generate tool WeatherLookup
```

Creates:
- `app/tools/weather_lookup_tool.rb`
- `test/tools/weather_lookup_tool_test.rb`

### Tool Structure

```ruby
class WeatherLookupTool < RubyLLM::Tool
  description "Get current weather for a city."
  param :city, type: :string, desc: "City name", required: true
  param :units, type: :string, desc: "Temperature units: celsius or fahrenheit"

  def execute(city:, units: "celsius")
    # Call a weather API, query a database, etc.
    response = WeatherApi.current(city: city, units: units)
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

| Type | Ruby Type | Example |
|---|---|---|
| `:string` | String | `"New York"` |
| `:integer` | Integer | `42` |
| `:number` | Float | `3.14` |
| `:boolean` | Boolean | `true` |
| `:array` | Array | `["tag1", "tag2"]` |
| `:object` | Hash | `{ key: "value" }` |

### Built-in Example Tools

RailsKit ships with three example tools in `app/tools/`:

**TicketLookupTool** — looks up support tickets by ID:
```ruby
class TicketLookupTool < RubyLLM::Tool
  description "Look up a support ticket by its ID to get status, subject, and details."
  param :ticket_id, type: :string, desc: "The ticket ID (e.g. TKT-1234)", required: true

  def execute(ticket_id:)
    # Replace with: SupportTicket.find_by!(ticket_number: ticket_id)
    { ticket_id: ticket_id, subject: "Cannot access billing page", status: "open", ... }
  end
end
```

**KnowledgeSearchTool** — searches help articles:
```ruby
class KnowledgeSearchTool < RubyLLM::Tool
  description "Search the knowledge base for help articles matching a query."
  param :query, type: :string, desc: "Search query", required: true
  param :limit, type: :integer, desc: "Max results (default: 3)"

  def execute(query:, limit: 3)
    # Replace with: Article.search(query).limit(limit)
    { query: query, results: [...].first(limit) }
  end
end
```

**OrderStatusTool** — checks order/subscription status:
```ruby
class OrderStatusTool < RubyLLM::Tool
  description "Check the status of a customer order or subscription."
  param :order_id, type: :string, desc: "The order ID (e.g. ORD-5678)"
  param :email, type: :string, desc: "Customer email address"

  def execute(order_id: nil, email: nil)
    return { error: "Provide order_id or email." } unless order_id || email
    # Replace with real lookup
    { order_id: order_id, plan: "Pro", status: "active", ... }
  end
end
```

> **Note:** These tools return hardcoded data as examples. Replace the `execute` body with real database queries or API calls.

---

## Streaming

### How Streaming Works

1. Client POSTs to `/api/agents/:name/stream`
2. `AgentsController#stream_chat` persists the user message and enqueues `AgentStreamJob`
3. `AgentStreamJob` calls `agent.stream(message)` with a block
4. RubyLLM yields each token chunk to the block
5. The block broadcasts via `AgentChatChannel.broadcast_to(conversation, ...)`
6. The React `useAgentStream` hook receives tokens via ActionCable WebSocket

### ActionCable Protocol

The channel broadcasts four message types:

```json
// Stream started
{ "type": "stream_start", "conversation_id": "..." }

// Each token
{ "type": "stream_token", "token": "Hello", "conversation_id": "..." }

// Stream complete
{
  "type": "stream_end",
  "conversation_id": "...",
  "message_id": "...",
  "model": "gpt-4o",
  "usage": { "input_tokens": 150, "output_tokens": 89 }
}

// Error
{ "type": "stream_error", "error": "Something went wrong.", "conversation_id": "..." }
```

### Frontend Hook

```typescript
import { useAgentStream } from "@/hooks/useAgentStream";

const { sendMessage, isStreaming, streamContent } = useAgentStream({
  onStart() { /* streaming began */ },
  onToken(token, accumulated) { /* each token + full text so far */ },
  onComplete(fullContent, { model, usage }) { /* done */ },
  onError(error) { /* handle error */ },
});

// Send a message and start streaming
const conversationId = await sendMessage("help_desk", "Check my ticket TKT-1234");
```

### Alternative: ActionCable `speak`

Clients can also send messages directly via the WebSocket channel (instead of HTTP POST):

```javascript
subscription.perform("speak", {
  message: "Check my ticket",
  agent_name: "help_desk"
});
```

---

## Structured Output

Use RubyLLM schemas to get structured JSON responses from the LLM.

### Define a Schema

Schemas live in `app/schemas/`:

```ruby
class SentimentSchema < RubyLLM::Schema
  field :sentiment, type: :string, desc: "positive, negative, or neutral"
  field :confidence, type: :number, desc: "Confidence score 0.0-1.0"
  field :reasoning, type: :string, desc: "Brief explanation"
end
```

### Use in an Agent

Include the `StructuredOutput` concern and call `structured_ask`:

```ruby
class AnalyticsAgent
  include StructuredOutput

  def analyze_sentiment(text)
    structured_ask(
      "Analyze the sentiment of this text: #{text}",
      schema: SentimentSchema
    )
  end
end
```

### Built-in Schemas

| Schema | Fields | Use Case |
|---|---|---|
| `SentimentSchema` | sentiment, confidence, reasoning | Text sentiment analysis |
| `ExtractionSchema` | name, email, company, order_id, intent | Extract structured data from messages |

---

## Conversation Persistence

### Chat Model

```ruby
chat = Chat.create!(agent_class: "HelpDeskAgent")
chat.messages.create!(role: "user", content: "Hello!")
chat.total_tokens        # sum of all message tokens
chat.total_input_tokens  # sum of input tokens
chat.total_output_tokens # sum of output tokens
```

### Message Model

```ruby
message = Message.create!(
  chat: chat,
  role: "assistant",     # system | user | assistant | tool
  content: "Hi there!",
  model_id: "gpt-4o",
  input_tokens: 25,
  output_tokens: 12,
  tool_calls: {},        # JSONB — tool invocations
  tool_result: nil       # JSONB — tool results
)

message.total_tokens     # input_tokens + output_tokens
Message.by_role("user")  # scope
Message.recent(5)        # last 5 messages
```

### Resuming Conversations

Pass a `conversation_id` to continue an existing chat:

```bash
POST /api/agents/help_desk/chat
{ "message": "Follow up question", "conversation_id": "a1b2c3d4-..." }
```

The controller finds the Chat, and the agent reconstructs the RubyLLM chat from persisted messages via `ActsAsChat#to_llm_chat`.

---

## Routing

Agent endpoints are dynamically routed:

```ruby
# config/routes.rb
post "agents/:agent_name/chat", to: "agents#chat"
post "agents/:agent_name/stream", to: "agents#stream_chat"
```

The `:agent_name` param is converted to a class name: `help_desk` → `HelpDeskAgent`, `customer_support` → `CustomerSupportAgent`.

No additional route configuration needed when you add a new agent.

---

## Switching AI Providers

RubyLLM auto-detects the provider from the model name:

```yaml
# railskit.yml — change to Anthropic
ai:
  provider: "anthropic"
  model: "claude-sonnet-4-20250514"
```

```bash
# .env — add the API key
ANTHROPIC_API_KEY=sk-ant-...
```

All agents automatically use the new provider. You can also override per-agent:

```ruby
agent = HelpDeskAgent.new(model: "gemini-2.0-flash")
```

Supported providers: OpenAI, Anthropic, Google (Gemini), Ollama (local).
