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

    trait :confirmed do
      confirmed_at { Time.current }
    end

    trait :unconfirmed do
      confirmed_at { nil }
      confirmation_token { Devise.friendly_token }
      confirmation_sent_at { Time.current }
    end

    trait :locked do
      confirmed_at { Time.current }
      locked_at { Time.current }
      failed_attempts { 10 }
    end

    trait :with_2fa do
      confirmed_at { Time.current }
      otp_secret { User.generate_otp_secret }
      otp_required_for_login { true }
      otp_backup_codes { Array.new(10) { SecureRandom.hex(4) } }
    end

    # Default: confirmed user (so existing tests don't break)
    after(:build) do |user|
      user.confirmed_at ||= Time.current unless user.confirmation_token.present?
    end
  end
end
