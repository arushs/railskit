# Build Your First Agent in 5 Minutes

Create an AI agent with RailsKit — from scaffold to working chat interface.

---

## 1. Generate the Agent

```bash
cd api
bin/rails generate agent CustomerSupport
```

This creates three files:

```
api/app/agents/customer_support_agent.rb        # Agent class
web/src/components/agents/CustomerSupportChat.tsx # React chat component
api/test/agents/customer_support_agent_test.rb   # Test file
```

## 2. Customize the Agent

Open `api/app/agents/customer_support_agent.rb`:

```ruby
# frozen_string_literal: true

class CustomerSupportAgent
  SYSTEM_PROMPT = <<~PROMPT
    You are CustomerSupport, a helpful AI assistant.
    Be concise, friendly, and professional.
  PROMPT

  attr_reader :llm_chat

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

  private

  def register_tools
    # @llm_chat.with_tool(SomeSearchTool)
  end
end
```

Customize the `SYSTEM_PROMPT` to define your agent's personality and behavior:

```ruby
SYSTEM_PROMPT = <<~PROMPT
  You are a customer support agent for Acme Corp.
  You help users with account issues, billing questions, and product support.
  Always check the knowledge base before asking the user for more info.
  If you can't resolve an issue, offer to create a support ticket.
PROMPT
```

## 3. Create a Tool

Tools let your agent take actions — search databases, call APIs, look up records.

```bash
bin/rails generate tool ProductSearch
```

This creates:
```
api/app/tools/product_search_tool.rb
api/test/tools/product_search_tool_test.rb
```

Open `api/app/tools/product_search_tool.rb`:

```ruby
# frozen_string_literal: true

class ProductSearchTool < RubyLLM::Tool
  description "Search the product catalog by name or category."
  param :query, type: :string, desc: "Search query", required: true
  param :category, type: :string, desc: "Product category to filter by"

  def execute(query:, category: nil)
    products = Product.where("name ILIKE ?", "%#{query}%")
    products = products.where(category: category) if category
    products.limit(5).map { |p| { name: p.name, price: p.price, url: p.url } }
  end
end
```

### Tool API Reference

Tools extend `RubyLLM::Tool` and define:

- **`description`** — what the tool does (the LLM reads this to decide when to call it)
- **`param`** — input parameters with `type:`, `desc:`, and optional `required: true`
- **`execute`** — the method that runs when the LLM calls the tool. Receives keyword arguments matching the defined params. Return a Hash or Array (serialized to JSON for the LLM).

Supported types: `:string`, `:integer`, `:number`, `:boolean`, `:array`, `:object`

## 4. Register the Tool

Back in your agent, register the tool:

```ruby
def register_tools
  @llm_chat.with_tool(ProductSearchTool)
end
```

You can register multiple tools:

```ruby
def register_tools
  @llm_chat.with_tool(ProductSearchTool)
  @llm_chat.with_tool(TicketLookupTool)
  @llm_chat.with_tool(OrderStatusTool)
end
```

## 5. Test It

### Via curl (non-streaming)

```bash
curl -X POST http://localhost:3000/api/agents/customer_support/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What products do you have in the electronics category?"}'
```

Response:
```json
{
  "response": "Here are our top electronics products...",
  "conversation_id": "a1b2c3d4-...",
  "model": "gpt-4o",
  "usage": {
    "input_tokens": 150,
    "output_tokens": 89
  }
}
```

### Via curl (streaming)

```bash
curl -X POST http://localhost:3000/api/agents/customer_support/stream \
  -H "Content-Type: application/json" \
  -d '{"message": "Help me find a product"}'
```

Response:
```json
{
  "conversation_id": "a1b2c3d4-..."
}
```

Then subscribe to `AgentChatChannel` via ActionCable with `{ conversation_id: "a1b2c3d4-..." }` to receive streamed tokens.

### Continue a conversation

Pass `conversation_id` to maintain context:

```bash
curl -X POST http://localhost:3000/api/agents/customer_support/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Tell me more about the first one", "conversation_id": "a1b2c3d4-..."}'
```

## 6. Use the React Chat Component

The generator creates a chat component at `web/src/components/agents/CustomerSupportChat.tsx`. It uses the `useAgentStream` hook for real-time streaming.

To add it to a page:

```tsx
import { CustomerSupportChat } from "@/components/agents/CustomerSupportChat";

export default function SupportPage() {
  return (
    <div className="h-screen">
      <CustomerSupportChat />
    </div>
  );
}
```

The chat component handles:
- Sending messages via POST to `/api/agents/customer_support/stream`
- Subscribing to ActionCable for streamed tokens
- Displaying messages with streaming animations
- Auto-scrolling to latest messages

---

## How It All Connects

```
User types message in React
  → useAgentStream.sendMessage("customer_support", message)
    → POST /api/agents/customer_support/stream
      → AgentsController#stream_chat
        → Persists user message to Chat/Messages
        → Enqueues AgentStreamJob
      ← { conversation_id }
    → Subscribes to AgentChatChannel(conversation_id)

AgentStreamJob runs in Solid Queue:
  → CustomerSupportAgent.new(conversation:).stream(message)
    → RubyLLM streams response, calling tools as needed
    → Each token broadcasted via ActionCable
  → Persists full assistant message with token counts

React receives:
  stream_start → stream_token ("Here") → stream_token ("'s") → ... → stream_end
  Updates UI in real-time
```

---

## Next Steps

- **Add structured output** — See [Agent Development Guide](agents.md) for schemas
- **Built-in example** — Study `HelpDeskAgent` with three tools (TicketLookup, KnowledgeSearch, OrderStatus)
- **Multiple models** — Pass `model:` to the agent constructor: `CustomerSupportAgent.new(model: "claude-sonnet-4-20250514")`
