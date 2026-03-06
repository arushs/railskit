# frozen_string_literal: true

FactoryBot.define do
  factory :embedding do
    vector { Array.new(1536) { rand(-1.0..1.0) }.to_s }
    model_used { "text-embedding-3-small" }
    chunk
  end
end
