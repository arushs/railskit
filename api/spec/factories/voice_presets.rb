# frozen_string_literal: true

FactoryBot.define do
  factory :voice_preset do
    sequence(:name) { |n| "Voice #{n}" }
    provider { "elevenlabs" }
    sequence(:voice_id) { |n| "voice_id_#{n}" }
    settings { { "stability" => 0.5, "similarity_boost" => 0.75 } }
    default { false }

    trait :default do
      default { true }
    end

    trait :rachel do
      name { "Rachel" }
      voice_id { "21m00Tcm4TlvDq8ikWAM" }
    end
  end
end
