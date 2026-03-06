# frozen_string_literal: true

FactoryBot.define do
  factory :chunk do
    document
    content { "This is a test chunk of text content." }
    sequence(:position) { |n| n }
  end
end
