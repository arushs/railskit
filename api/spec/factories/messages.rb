# frozen_string_literal: true

FactoryBot.define do
  factory :message do
    chat
    role { "user" }
    content { Faker::Lorem.sentence }
    input_tokens { 100 }
    output_tokens { 50 }

    trait :assistant do
      role { "assistant" }
      model_id { "gpt-4o" }
    end

    trait :system do
      role { "system" }
    end

    trait :tool do
      role { "tool" }
      tool_calls { { "name" => "search", "arguments" => {} } }
    end
  end
end
