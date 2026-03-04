# frozen_string_literal: true

FactoryBot.define do
  factory :subscription do
    user
    plan
    stripe_subscription_id { "sub_#{SecureRandom.hex(12)}" }
    stripe_customer_id { "cus_#{SecureRandom.hex(12)}" }
    status { "active" }
    current_period_start { Time.current }
    current_period_end { 1.month.from_now }

    trait :trialing do
      status { "trialing" }
    end

    trait :canceled do
      status { "canceled" }
      canceled_at { Time.current }
    end

    trait :past_due do
      status { "past_due" }
    end
  end
end
