# frozen_string_literal: true

class Membership < ApplicationRecord
  belongs_to :team
  belongs_to :user

  enum :role, { member: 0, admin: 1, owner: 2 }

  validates :role, presence: true
  validates :user_id, uniqueness: { scope: :team_id }
end
