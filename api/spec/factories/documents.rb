# frozen_string_literal: true

FactoryBot.define do
  factory :document do
    collection
    sequence(:title) { |n| "Document #{n}" }
    source_type { "text" }
    status { "ready" }
    raw_content { "Sample document content for testing." }
  end
end
