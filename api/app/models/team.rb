# frozen_string_literal: true

class Team < ApplicationRecord
  belongs_to :owner, class_name: "User"

  has_many :team_memberships, dependent: :destroy
  has_many :members, through: :team_memberships, source: :user
  has_many :team_invitations, dependent: :destroy

  validates :name, presence: true, length: { maximum: 100 }
  validates :slug, presence: true, uniqueness: true, format: { with: /\A[a-z0-9\-]+\z/ }

  scope :personal, -> { where(personal: true) }
  scope :organization, -> { where(personal: false) }

  before_validation :generate_slug, on: :create

  def add_member!(user, role: "member")
    team_memberships.create!(user: user, role: role)
  end

  def remove_member!(user)
    membership = team_memberships.find_by!(user: user)
    raise "Cannot remove team owner" if membership.role == "owner"
    membership.destroy!
  end

  def member?(user)
    team_memberships.exists?(user: user)
  end

  def role_for(user)
    team_memberships.find_by(user: user)&.role
  end

  private

  def generate_slug
    return if slug.present?

    base = name.to_s.parameterize
    candidate = base
    counter = 1
    while Team.exists?(slug: candidate)
      candidate = "#{base}-#{counter}"
      counter += 1
    end
    self.slug = candidate
  end
end
