# frozen_string_literal: true

FactoryBot.define do
  factory :voice_session do
    association :chat
    association :user
    status { "active" }
    started_at { Time.current }
    audio_format { "pcm_16000" }

    trait :with_preset do
      association :voice_preset
    end

    trait :ended do
      status { "ended" }
      ended_at { Time.current + 5.minutes }
      duration { 300 }
    end
  end
end
