# frozen_string_literal: true

FactoryBot.define do
  factory :collection do
    association :user
    sequence(:name) { |n| "Collection #{n}" }
    description { "A test collection" }

    trait :with_documents do
      transient do
        document_count { 2 }
      end

      after(:create) do |collection, evaluator|
        create_list(:document, evaluator.document_count, :ready, collection: collection)
      end
    end
  end
end
