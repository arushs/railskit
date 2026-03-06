# frozen_string_literal: true

FactoryBot.define do
  factory :collection do
    sequence(:name) { |n| "Collection #{n}" }
    description { "A test collection" }
  end
end
