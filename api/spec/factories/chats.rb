# frozen_string_literal: true

FactoryBot.define do
  factory :chat do
    agent_class { "HelpDeskAgent" }
    model_id { "gpt-4o" }

    trait :with_messages do
      after(:create) do |chat|
        create(:message, chat: chat, role: "user", content: "Hello")
        create(:message, chat: chat, role: "assistant", content: "Hi there!")
      end
    end
  end
end
