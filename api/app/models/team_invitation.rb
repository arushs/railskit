# frozen_string_literal: true

class TeamInvitation < ApplicationRecord
  belongs_to :team
  belongs_to :inviter, class_name: "User"

  validates :email, presence: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :role, presence: true, inclusion: { in: %w[member admin] }
  validates :token, presence: true, uniqueness: true
  validates :expires_at, presence: true

  before_validation :generate_token, on: :create
  before_validation :set_expires_at, on: :create

  scope :pending, -> { where(accepted_at: nil).where("expires_at > ?", Time.current) }

  def expired?
    expires_at < Time.current
  end

  def accepted?
    accepted_at.present?
  end

  private

  def generate_token
    self.token ||= SecureRandom.urlsafe_base64(32)
  end

  def set_expires_at
    self.expires_at ||= 7.days.from_now
  end
end
