# frozen_string_literal: true

FactoryBot.define do
  factory :chunk do
    association :document
    content { "This is a test chunk with some content for embedding." }
    sequence(:position) { |n| n }
    start_offset { 0 }
    end_offset { 50 }
    token_count { 12 }
    metadata { {} }
  end
end
