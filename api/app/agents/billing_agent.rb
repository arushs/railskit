# frozen_string_literal: true

class BillingAgent
  include StructuredOutput
  include AsTool
  include Handoff

  tool_name "billing"
  tool_description "Handles billing questions, refunds, invoices, and payment issues."
  tool_param :message, type: :string, desc: "The user's billing question", required: true

  SYSTEM_PROMPT = <<~PROMPT
    You are a billing specialist for a SaaS application.
    You can look up invoices, process refunds, update payment methods,
    and answer billing-related questions. Be precise with amounts and dates.
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
