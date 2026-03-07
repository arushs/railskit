# frozen_string_literal: true

FactoryBot.define do
  factory :team_invitation do
    team
    association :inviter, factory: :user
    email { Faker::Internet.unique.email }
    role { "member" }

    trait :admin_invite do
      role { "admin" }
    end

    trait :expired do
      expires_at { 1.day.ago }
    end

    trait :accepted do
      accepted_at { Time.current }
    end
  end
end
