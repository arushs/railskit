# frozen_string_literal: true

class Plan < ApplicationRecord
  has_many :subscriptions, dependent: :restrict_with_error

  validates :name, presence: true
  validates :slug, presence: true, uniqueness: true
  validates :stripe_price_id, presence: true, uniqueness: true
  validates :interval, inclusion: { in: %w[month year] }
  validates :amount_cents, numericality: { greater_than_or_equal_to: 0 }

  scope :active, -> { where(active: true) }
  scope :ordered, -> { order(:sort_order, :amount_cents) }

  def feature?(key)
    features.fetch(key.to_s, false) == true
  end

  def feature_value(key)
    features.fetch(key.to_s, nil)
  end

  def free?
    amount_cents.zero?
  end

  def display_price
    return "Free" if free?
    "$#{amount_cents / 100.0}/#{interval}"
  end
end
