# frozen_string_literal: true

require_relative "../../lib/railskit/voice_enabled"

class VoiceSupportAgent
  include RubyLLM::Agent
  include RailsKit::VoiceEnabled

  voice_preset :Rachel
  voice_response_mode :concise

  configure do |config|
    config.tools = [KnowledgeBaseSearch]
  end

  attr_reader :llm_chat, :chat

  INSTRUCTIONS = <<~PROMPT
    You are a friendly voice customer support agent. Keep responses concise
    (1-3 sentences) since this is a voice conversation. Be warm and natural.
    Help users with their questions and look up information when needed.
  PROMPT

  def initialize(chat: nil, model: nil)
    @chat = chat
    @llm_chat = chat ? chat.to_llm_chat(model: model) : RubyLLM.chat(model: model)
    @llm_chat.with_instructions(voice_enabled? ? voice_instructions : INSTRUCTIONS)
  end

  def ask(message)
    response = @llm_chat.ask(message)
    @chat&.persist_exchange(user_content: message, response: response)
    response
  end

  def instructions
    INSTRUCTIONS
  end
end
