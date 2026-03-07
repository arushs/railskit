# frozen_string_literal: true

class HelpDeskAgent
  include StructuredOutput
  include AsTool
  include Handoff

  tool_name "help_desk"
  tool_description "Handles general support questions, ticket lookups, and knowledge base searches."
  tool_param :message, type: :string, desc: "The user's support question", required: true

  SYSTEM_PROMPT = <<~PROMPT
    You are a help desk specialist for a SaaS application.
    You can search the knowledge base, create support tickets,
    and send follow-up emails. Be helpful and thorough.
  PROMPT

  attr_reader :llm_chat, :conversation

  def initialize(conversation: nil, model: nil)
    @conversation = conversation
    @llm_chat = conversation ? conversation.to_llm_chat(model: model) : RubyLLM.chat(model: model)
    @llm_chat.with_instructions(SYSTEM_PROMPT)
  end

  def ask(message)
    response = @llm_chat.ask(message)
    @conversation&.persist_exchange(user_content: message, response: response)
    response
  end

  def stream(message, &block)
    @llm_chat.ask(message, &block)
  end
end
