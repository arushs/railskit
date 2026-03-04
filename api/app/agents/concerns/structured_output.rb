# frozen_string_literal: true

module StructuredOutput
  extend ActiveSupport::Concern

  def structured_ask(message, schema:, model: nil)
    chat = model ? RubyLLM.chat(model: model) : @llm_chat || RubyLLM.chat
    chat.with_output_schema(schema)
    chat.ask(message)
  end
end
