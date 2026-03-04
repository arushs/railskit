# Build Your First Agent in 5 Minutes

This guide walks you through creating an AI agent with RailsKit — from scaffold to working chat interface.

---

## Prerequisites

- RailsKit set up and running (`bin/dev`)
- At least one AI provider configured in `railskit.yml` (OpenAI, Anthropic, or Google)

---

## 1. Generate the Agent

```bash
cd api
bin/rails generate agent HelpDesk
```

This creates three files:

```
api/app/agents/help_desk_agent.rb          # Agent class
api/test/agents/help_desk_agent_test.rb    # Test
web/src/pages/agents/HelpDesk.tsx          # React chat UI
```

## 2. Define the Agent

Open `api/app/agents/help_desk_agent.rb`:

```ruby
class HelpDeskAgent < RubyLLM::Agent
  model "claude-sonnet-4"  # or "gpt-4o", "gemini-2.0-flash", etc.

  instructions <<~PROMPT
    You are a helpful support agent for #{RailsKit.config.app.name}.
    
    Be concise and friendly. If you don't know something, say so.
    Always try to help the user solve their problem.
  PROMPT

  # Tools the agent can use (we'll add these next)
  tools LookupUser, SearchDocs
end
```

## 3. Create a Tool

Tools give your agent the ability to take actions — query databases, call APIs, look up information.

```bash
bin/rails generate tool LookupUser
```

Edit `api/app/tools/lookup_user.rb`:

```ruby
class LookupUser < RubyLLM::Tool
  description "Look up a user's account details by email address"

  param :email, desc: "The user's email address", required: true

  def execute(email:)
    user = User.find_by(email: email)
    return { error: "No user found with that email" } unless user

    {
      name: user.name,
      email: user.email,
      plan: user.plan.name,
      created_at: user.created_at.strftime("%B %d, %Y"),
      subscription_status: user.subscription&.status || "none"
    }
  end
end
```

Create another tool:

```bash
bin/rails generate tool SearchDocs
```

```ruby
class SearchDocs < RubyLLM::Tool
  description "Search the knowledge base for help articles"

  param :query, desc: "The search query", required: true

  def execute(query:)
    # Replace with your actual search logic
    articles = HelpArticle.search(query).limit(3)

    articles.map do |a|
      { title: a.title, url: a.url, excerpt: a.excerpt }
    end
  end
end
```

## 4. Wire Up the API

The agent generator creates a controller endpoint automatically. The default route is:

```
POST /api/v1/agents/help_desk/chat
```

The controller handles:
- Creating/loading a conversation (`Chat` model with `acts_as_chat`)
- Dispatching the user's message to the agent
- Streaming the response back via ActionCable

## 5. Try It Out

Open [http://localhost:5173/agents/help-desk](http://localhost:5173/agents/help-desk).

You'll see a chat interface. Type a message. The agent responds in real-time with streaming text.

Try: *"Look up the account for john@example.com"* — the agent calls the `LookupUser` tool automatically.

## 6. Test in the Console

```bash
cd api && bin/rails console
```

```ruby
chat = Chat.create!(agent_class: "HelpDeskAgent")
response = chat.ask("What can you help me with?")
puts response.content
```

---

## How It Works Under the Hood

```
User types message in React
    ↓
WebSocket sends to AgentChannel (ActionCable)
    ↓
AgentChannel loads the Chat (acts_as_chat)
    ↓
Chat dispatches to HelpDeskAgent
    ↓
Agent sends message + history to LLM provider
    ↓
LLM decides to call a tool (e.g., LookupUser)
    ↓
Tool executes, returns result to LLM
    ↓
LLM generates final response
    ↓
Response streams back chunk-by-chunk via ActionCable
    ↓
React renders each chunk as it arrives
```

Every message, tool call, and response is automatically persisted. Token usage and costs are tracked per conversation.

---

## Next Steps

- **Add more tools** — `bin/rails generate tool <Name>`
- **Create more agents** — `bin/rails generate agent <Name>`
- **Customize the chat UI** — Edit `web/src/pages/agents/HelpDesk.tsx`
- **Switch models** — Change `model "claude-sonnet-4"` to any RubyLLM-supported model
- **View costs** — Check the Agent Dashboard at `/dashboard/agents`
- **Read the full guide** — [Agent Development Guide](agents.md)
