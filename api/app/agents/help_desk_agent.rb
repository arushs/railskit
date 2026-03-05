# frozen_string_literal: true

class HelpDeskAgent
  include RubyLLM::Agent

  configure do |config|
    config.tools = [KnowledgeBaseSearch, CreateSupportTicket, SendFollowUpEmail]
  end

  attr_reader :llm_chat, :chat

  def initialize(chat: nil, model: nil)
    @chat = chat
    @llm_chat = chat ? chat.to_llm_chat(model: model) : RubyLLM.chat(model: model)
  end

  def ask(message)
    response = @llm_chat.ask(message)
    @chat&.persist_exchange(user_content: message, response: response)
    response
  end
end
