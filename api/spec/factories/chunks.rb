# frozen_string_literal: true

FactoryBot.define do
  factory :chunk do
    content { "This is a test chunk with some content for embedding." }
    position { 0 }
    token_count { 50 }
    document
  end
end
