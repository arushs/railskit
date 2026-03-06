# frozen_string_literal: true

FactoryBot.define do
  factory :document_collection do
    sequence(:name) { |n| "Collection #{n}" }
    chunking_strategy { "paragraph" }
    chunk_size { 512 }
    chunk_overlap { 50 }
    embedding_model { "text-embedding-3-small" }
  end
end
