# frozen_string_literal: true

class TeamInvitation < ApplicationRecord
  belongs_to :team
  belongs_to :invited_by, class_name: "User"

  validates :email, presence: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :role, presence: true, inclusion: { in: TeamMembership::ROLES - ["owner"] }
  validates :token, uniqueness: true
  validates :email, uniqueness: { scope: :team_id, conditions: -> { where(accepted_at: nil) },
                                   message: "has already been invited" }

  before_create :generate_token
  before_create :set_expiration

  scope :pending, -> { where(accepted_at: nil).where("expires_at > ?", Time.current) }
  scope :expired, -> { where("expires_at <= ?", Time.current) }

  def expired?
    expires_at <= Time.current
  end

  def accepted?
    accepted_at.present?
  end

  def accept!(user)
    raise "Invitation has expired" if expired?
    raise "Invitation has already been accepted" if accepted?

    transaction do
      team.add_member!(user, role: role)
      update!(accepted_at: Time.current)
    end
  end

  private

  def generate_token
    self.token = SecureRandom.urlsafe_base64(32)
  end

  def set_expiration
    self.expires_at ||= 7.days.from_now
  end
end
