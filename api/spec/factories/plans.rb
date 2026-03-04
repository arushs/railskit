# frozen_string_literal: true

FactoryBot.define do
  factory :plan do
    name { "Pro" }
    slug { Faker::Internet.unique.slug }
    stripe_price_id { "price_#{SecureRandom.hex(12)}" }
    interval { "month" }
    amount_cents { 2900 }
    currency { "usd" }
    features { { "api_access" => true, "max_agents" => 5 } }
    active { true }
    sort_order { 0 }

    trait :free do
      name { "Free" }
      amount_cents { 0 }
    end

    trait :annual do
      interval { "year" }
      amount_cents { 29_000 }
    end

    trait :inactive do
      active { false }
    end
  end
end
