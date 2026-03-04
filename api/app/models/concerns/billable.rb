# frozen_string_literal: true

# Include in your User model: `include Billable`
module Billable
  extend ActiveSupport::Concern

  included do
    has_many :subscriptions, dependent: :destroy
  end

  def active_subscription
    subscriptions.active.order(created_at: :desc).first
  end

  def subscribed?
    active_subscription.present?
  end

  def current_plan
    active_subscription&.plan
  end

  def feature?(key)
    active_subscription&.feature?(key) || false
  end

  def stripe_customer_id
    subscriptions.where.not(stripe_customer_id: nil).order(created_at: :desc).pick(:stripe_customer_id)
  end
end
