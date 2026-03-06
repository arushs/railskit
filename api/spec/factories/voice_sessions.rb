# frozen_string_literal: true

FactoryBot.define do
  factory :voice_session do
    association :user
    status { "idle" }
    stt_provider { "openai" }
    tts_provider { "openai" }
    tts_voice { "alloy" }
    agent_class { "HelpDeskAgent" }
    language { "en" }
    turn_count { 0 }

    trait :listening do
      status { "listening" }
    end

    trait :processing do
      status { "processing" }
    end

    trait :speaking do
      status { "speaking" }
    end

    trait :with_chat do
      after(:create) do |session|
        chat = create(:chat, user: session.user, agent_class: session.agent_class)
        session.update!(chat: chat)
      end
    end
  end
end
