# frozen_string_literal: true

FactoryBot.define do
  factory :document do
    association :collection
    sequence(:title) { |n| "Document #{n}" }
    source_type { "text" }
    content_type { "text/plain" }
    status { "pending" }

    trait :ready do
      status { "ready" }
      raw_content { "This is sample document content for testing purposes. It contains multiple sentences." }
      chunk_count { 1 }
    end

    trait :with_url do
      source_type { "url" }
      source_url { "https://example.com/article" }
    end

    trait :errored do
      status { "error" }
      error_message { "Processing failed" }
    end
  end
end
