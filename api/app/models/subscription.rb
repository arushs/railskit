# frozen_string_literal: true

class Subscription < ApplicationRecord
  belongs_to :user
  belongs_to :plan

  validates :stripe_subscription_id, presence: true, uniqueness: true
  validates :stripe_customer_id, presence: true
  validates :status, presence: true

  ACTIVE_STATUSES = %w[active trialing].freeze

  scope :active, -> { where(status: ACTIVE_STATUSES) }
  scope :by_customer, ->(customer_id) { where(stripe_customer_id: customer_id) }

  def active?
    ACTIVE_STATUSES.include?(status)
  end

  def canceled?
    status == "canceled"
  end

  def past_due?
    status == "past_due"
  end

  def feature?(key)
    plan.feature?(key)
  end
end
