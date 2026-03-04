# frozen_string_literal: true

FactoryBot.define do
  factory :user do
    email { Faker::Internet.unique.email }
    password { "password123" }
    name { Faker::Name.name }
    plan { "free" }

    trait :starter do
      plan { "starter" }
    end

    trait :pro do
      plan { "pro" }
    end

    trait :enterprise do
      plan { "enterprise" }
    end

    trait :with_oauth do
      provider { "google_oauth2" }
      uid { Faker::Number.unique.number(digits: 10).to_s }
    end

    trait :with_magic_link do
      magic_link_token { SecureRandom.urlsafe_base64(32) }
      magic_link_sent_at { Time.current }
    end

    trait :with_expired_magic_link do
      magic_link_token { SecureRandom.urlsafe_base64(32) }
      magic_link_sent_at { 20.minutes.ago }
    end
  end
end
