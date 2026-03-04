# frozen_string_literal: true

# RubyLLM configuration — reads AI provider settings from railskit.yml

RubyLLM.configure do |config|
  ai = RailsKit.config.ai

  case ai.provider.to_s
  when "openai"
    config.openai_api_key = ENV.fetch("OPENAI_API_KEY", nil)
  when "anthropic"
    config.anthropic_api_key = ENV.fetch("ANTHROPIC_API_KEY", nil)
  when "google"
    config.gemini_api_key = ENV.fetch("GEMINI_API_KEY", nil)
  when "ollama"
    # Ollama runs locally — no API key needed
  end

  config.default_model = ai.model.to_s if ai.model

  Rails.logger.info("[RubyLLM] Configured with provider=#{ai.provider} model=#{ai.model}")
end
