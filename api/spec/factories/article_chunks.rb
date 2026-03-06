# frozen_string_literal: true

FactoryBot.define do
  factory :article_chunk do
    article
    sequence(:chunk_index)
    chunk_text { Faker::Lorem.paragraph(sentence_count: 10) }

    trait :with_embedding do
      embedding { Array.new(768) { rand(-1.0..1.0) } }
    end
  end
end
