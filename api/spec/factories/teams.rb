# frozen_string_literal: true

FactoryBot.define do
  factory :team do
    name { Faker::Company.name }
    association :owner, factory: :user

    trait :personal do
      personal { true }
    end

    after(:create) do |team|
      create(:membership, team: team, user: team.owner, role: :owner)
    end
  end
end
