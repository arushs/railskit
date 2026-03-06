# frozen_string_literal: true

FactoryBot.define do
  factory :audio_segment do
    association :voice_session
    content { "fake_audio_data_bytes" }
    speaker { "user" }
    duration { 2.5 }
    transcript { "Hello, how are you?" }

    trait :agent do
      speaker { "agent" }
      transcript { "I'm doing well, thanks!" }
    end
  end
end
