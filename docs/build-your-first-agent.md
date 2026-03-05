# Build Your First Agent in 5 Minutes

You're about to build a working AI-powered customer support agent. It'll answer questions, look up orders, and escalate to humans — in under 5 minutes.

---

## Prerequisites

- **RailsKit installed and running** — you've done `bin/setup` and can hit `localhost:5173`. If not, follow the [README](../README.md) first.
- **An API key** for [OpenAI](https://platform.openai.com/api-keys) or [Anthropic](https://console.anthropic.com/settings/keys), set in your `.env` file.

That's it. Let's build.

---

## Step 1: Generate the Agent (30 seconds)

```bash
cd api
bin/rails generate agent CustomerSupport
```

You'll see:

```
Agent 'CustomerSupportAgent' created!
  api/app/agents/customer_support_agent.rb
  web/src/components/agents/CustomerSupportChat.tsx
  api/test/agents/customer_support_agent_test.rb
```

Three files. Here's what each one does:

| File | Purpose |
|------|---------|
| `api/app/agents/customer_support_agent.rb` | Your agent's brain — personality, model, tools |
| `web/src/components/agents/CustomerSupportChat.tsx` | A ready-to-use React chat UI with streaming |
| `api/test/agents/customer_support_agent_test.rb` | Test file so you can TDD your agent |

One command, and you've got a full-stack AI agent scaffold. Let's make it smart.

---

## Step 2: Define the Agent's Personality (1 minute)

Open `api/app/agents/customer_support_agent.rb`. The generator gave you a skeleton — let's give it a real personality:

```ruby
# frozen_string_literal: true

class CustomerSupportAgent
  SYSTEM_PROMPT = <<~PROMPT
    You are a friendly, knowledgeable customer support agent for our SaaS platform.

    Your job:
    - Answer questions about accounts, billing, and features
    - Look up order details when customers ask about purchases
    - Search the knowledge base before saying "I don't know"
    - If you can't resolve something, offer to escalate to a human

    Tone: Helpful, concise, never robotic. Use the customer's name when you have it.
    Never make up information — if you're unsure, say so and offer to connect them with the team.
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

  def stream(message, &block)
    @llm_chat.ask(message, &block)
  end

  private

  def register_tools
    @llm_chat.with_tool(LookupOrderTool)
  end
end
```

The key parts:

- **`SYSTEM_PROMPT`** — This is your agent's personality. The LLM follows these instructions for every response. Be specific about tone and boundaries.
- **`model:`** — Defaults to whatever you set in `railskit.yml`. Pass `"claude-sonnet-4-20250514"` or `"gpt-4o"` to override per-agent.
- **`register_tools`** — Where you give the agent abilities. We'll create `LookupOrderTool` next.

---

## Step 3: Add a Tool (2 minutes)

Agents without tools are just chatbots. Tools let your agent *do things* — query databases, call APIs, take actions. Let's give ours the ability to look up orders.

```bash
bin/rails generate tool LookupOrder
```

```
Tool 'LookupOrderTool' created!
  api/app/tools/lookup_order_tool.rb
  api/test/tools/lookup_order_tool_test.rb
```

Open `api/app/tools/lookup_order_tool.rb` and replace the scaffold with a real implementation:

```ruby
# frozen_string_literal: true

class LookupOrderTool < RubyLLM::Tool
  description "Look up a customer's order by order ID or email address. Returns order status, items, and shipping info."

  param :order_id, type: :string, desc: "The order ID (e.g. ORD-1234)"
  param :email,    type: :string, desc: "Customer email address"

  def execute(order_id: nil, email: nil)
    return { error: "Please provide an order ID or email address." } unless order_id || email

    order = if order_id
              Order.find_by(order_number: order_id)
            else
              Order.where(email: email).order(created_at: :desc).first
            end

    return { error: "No order found." } unless order

    {
      order_id:    order.order_number,
      email:       order.email,
      status:      order.status,
      total:       order.total.format,
      items:       order.line_items.map { |li| { name: li.product_name, qty: li.quantity } },
      placed_at:   order.created_at.strftime("%B %d, %Y"),
      tracking_url: order.tracking_url
    }
  end
end
```

That's a real tool. Here's what matters:

- **`description`** — The LLM reads this to decide *when* to call the tool. Make it clear and specific.
- **`param`** — Each parameter the LLM can pass. Include `type:` and `desc:` so the model knows what to send.
- **`execute`** — Runs when the LLM decides to use this tool. It's just Ruby — ActiveRecord queries, API calls, whatever you need. Return a Hash or Array and it gets serialized to JSON for the LLM to interpret.

The LLM decides when to call your tool based on the conversation. When a customer says "Where's my order ORD-5678?", the agent will automatically call `LookupOrderTool` with `order_id: "ORD-5678"`, get the result, and weave it into a natural response.

> **Tip:** Want to add more tools? Generate them the same way and register them in your agent's `register_tools` method. Check out the built-in `HelpDeskAgent` for an example with three tools — `TicketLookupTool`, `KnowledgeSearchTool`, and `OrderStatusTool`.

---

## Step 4: Wire Up the React Chat UI (1 minute)

The generator already created a chat component at `web/src/components/agents/CustomerSupportChat.tsx`. It's a complete chat interface — message bubbles, input field, loading state — ready to go.

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

Under the hood, the generated component calls `POST /api/agents/customer_support/chat` with each message. For streaming (recommended), RailsKit includes the `useAgentChat` hook at `web/src/hooks/useAgentChat.ts`:

```tsx
import { useAgentChat } from "@/hooks/useAgentChat";

function SupportChat({ conversationId }: { conversationId: number }) {
  const {
    messages,          // Full message history
    sendMessage,       // Send a user message
    isStreaming,        // True while the agent is responding
    streamingContent,  // Partial content as it streams in
    activeToolCalls,   // Tools being called right now
    connectionStatus,  // "connected" | "connecting" | "disconnected"
  } = useAgentChat({
    conversationId,
    onToolCall: (tc) => console.log("Agent is using:", tc.function.name),
  });

  return (
    <div>
      {messages.map((m) => (
        <MessageBubble key={m.id} message={m} />
      ))}
      {isStreaming && <StreamingBubble content={streamingContent} />}
      <ChatInput onSend={sendMessage} disabled={isStreaming} />
    </div>
  );
}
```

The hook connects via ActionCable (WebSocket) for real-time streaming, with automatic SSE fallback. Tokens stream in one-by-one — your users see the response being typed out in real time.

---

## Step 5: Test It (30 seconds)

Start the dev server:

```bash
bin/dev
```

This boots the Rails API on port 3000 and Vite on port 5173 concurrently.

Open [localhost:5173](http://localhost:5173), navigate to your chat page, and type:

> "Hi! Can you check on order ORD-5678 for me?"

Watch the agent respond — it'll call your `LookupOrderTool`, get the order details, and reply with a natural-language summary. Tokens stream in real-time.

### Quick test via curl

```bash
curl -s -X POST http://localhost:3000/api/agents/customer_support/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What can you help me with?"}' | jq
```

```json
{
  "response": "I can help you with account questions, billing issues, and order lookups. Just ask!",
  "conversation_id": 1,
  "model": "gpt-4o",
  "usage": { "input_tokens": 142, "output_tokens": 28 }
}
```

Pass `conversation_id` back to continue the conversation with full context.

---

## What Just Happened

Here's the full request flow — everything that fired when you typed that message:

```
React UI
  → useAgentChat.sendMessage("Check order ORD-5678")
    → POST /api/agents/customer_support/stream
      → AgentsController#stream_chat
        → Persists user message to the database
        → Enqueues AgentStreamJob (Solid Queue)
      ← Returns { conversation_id }
    → Subscribes to AgentChatChannel via ActionCable (WebSocket)

AgentStreamJob (background):
  → CustomerSupportAgent.new(conversation:)
    → RubyLLM sends prompt + tools to OpenAI/Anthropic
    ← LLM decides to call LookupOrderTool(order_id: "ORD-5678")
    → Tool runs your ActiveRecord query, returns order data
    → LLM composes a natural response using the order data
    → Each token broadcasts via ActionCable as it generates

React receives:
  stream_start → stream_token → stream_token → ... → stream_end
  → UI updates in real-time, character by character
```

The pieces: **React** → **ActionCable** (WebSocket) → **Rails controller** → **Solid Queue job** → **RubyLLM** → **OpenAI/Anthropic** → streamed tokens back through the same WebSocket.

Conversation history is persisted automatically. Tool calls, token counts, and costs are all tracked in the database.

---

## Next Steps

You've got a working AI agent. Here's where to go from here:

- **Add more tools** — `bin/rails generate tool EscalateToHuman` and wire it up. Your agent gets smarter with every tool you add.
- **Study the built-in example** — `HelpDeskAgent` at `api/app/agents/help_desk_agent.rb` ships with three tools and shows production patterns.
- **Switch models** — Pass `model: "claude-sonnet-4-20250514"` to the agent constructor, or change the default in `railskit.yml`.
- **Add structured output** — Use the `StructuredOutput` concern for type-safe responses with JSON schemas. See the [Agent Development Guide](agents.md).
- **Customize the dashboard** — The `AgentDashboardLayout` component at `web/src/components/dashboard/` gives you a starting point for admin views.
- **Deploy** — `bin/deploy render` or `bin/deploy fly` when you're ready to ship. See the [Deployment Guide](deployment.md).

---

*That's it. Five files, five minutes, one working AI agent. Now go build something your customers will love.*
