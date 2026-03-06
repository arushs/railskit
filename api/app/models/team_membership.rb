# frozen_string_literal: true

class TeamMembership < ApplicationRecord
  ROLES = %w[owner admin member viewer].freeze

  belongs_to :team
  belongs_to :user

  validates :role, presence: true, inclusion: { in: ROLES }
  validates :user_id, uniqueness: { scope: :team_id, message: "is already a member of this team" }

  scope :admins, -> { where(role: %w[owner admin]) }
  scope :owners, -> { where(role: "owner") }

  def admin_or_above?
    role.in?(%w[owner admin])
  end

  def owner?
    role == "owner"
  end
end
