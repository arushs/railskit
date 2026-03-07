# frozen_string_literal: true

FactoryBot.define do
  factory :membership do
    team
    user
    role { :member }

    trait :admin do
      role { :admin }
    end

    trait :owner do
      role { :owner }
    end
  end
end
