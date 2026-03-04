# frozen_string_literal: true

class SentimentSchema < RubyLLM::Schema
  field :sentiment, type: :string, desc: "positive, negative, or neutral"
  field :confidence, type: :number, desc: "Confidence score 0.0-1.0"
  field :reasoning, type: :string, desc: "Brief explanation"
end
