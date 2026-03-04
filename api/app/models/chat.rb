# frozen_string_literal: true

class Chat < ApplicationRecord
  include ActsAsChat
  has_many :messages, -> { order(:created_at) }, dependent: :destroy, inverse_of: :chat
  validates :agent_class, presence: true
end
