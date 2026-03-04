# frozen_string_literal: true

class HelpDeskAgent
  include StructuredOutput

  SYSTEM_PROMPT = <<~PROMPT
    You are a friendly help desk assistant for a SaaS application.
    You can look up tickets, search the knowledge base, and check order status.
    Always be helpful, concise, and professional.
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

  # Stream response token-by-token, yielding each chunk to the caller.
  # Returns the final complete response object.
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
