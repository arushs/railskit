# frozen_string_literal: true

FactoryBot.define do
  factory :article do
    title { Faker::Lorem.sentence(word_count: 5) }
    body { Faker::Lorem.paragraphs(number: 3).join("\n\n") }
    published_at { Time.current }

    trait :unpublished do
      published_at { nil }
    end

    trait :old do
      published_at { 90.days.ago }
    end

    trait :recent do
      published_at { 1.day.ago }
    end
  end
end
