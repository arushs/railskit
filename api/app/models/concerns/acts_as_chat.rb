# frozen_string_literal: true

module ActsAsChat
  extend ActiveSupport::Concern

  included do
    def total_tokens      = messages.sum(:input_tokens).to_i + messages.sum(:output_tokens).to_i
    def total_input_tokens  = messages.sum(:input_tokens).to_i
    def total_output_tokens = messages.sum(:output_tokens).to_i
  end

  def to_llm_chat(model: nil)
    chat = RubyLLM.chat(model: model || model_id || RailsKit.config.ai.model)
    messages.each do |msg|
      case msg.role
      when "system"    then chat.with_instructions(msg.content)
      when "user", "assistant" then chat.add_message(role: msg.role.to_sym, content: msg.content)
      end
    end
    chat
  end

  def persist_message(role:, content:, **attrs)
    messages.create!(role: role.to_s, content: content,
      **attrs.slice(:model_id, :input_tokens, :output_tokens, :tool_calls, :tool_result))
  end

  def persist_exchange(user_content:, response:)
    persist_message(role: "user", content: user_content)
    persist_message(role: "assistant", content: response.content,
      model_id: response.respond_to?(:model_id) ? response.model_id : nil,
      input_tokens: response.respond_to?(:input_tokens) ? response.input_tokens : nil,
      output_tokens: response.respond_to?(:output_tokens) ? response.output_tokens : nil)
  end
end
