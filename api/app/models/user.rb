# frozen_string_literal: true

class User < ApplicationRecord
  devise :database_authenticatable, :registerable, :recoverable,
         :rememberable, :trackable, :validatable,
         :jwt_authenticatable, :omniauthable,
         jwt_revocation_strategy: JwtDenylist,
         omniauth_providers: [:google_oauth2]

  has_many :chats, dependent: :destroy
  has_many :collections, dependent: :destroy
  has_many :voice_sessions, dependent: :destroy

  # Teams
  has_many :team_memberships, dependent: :destroy
  has_many :teams, through: :team_memberships
  has_many :owned_teams, class_name: "Team", foreign_key: :owner_id, dependent: :destroy
  belongs_to :current_team, class_name: "Team", optional: true

  validates :plan, inclusion: { in: %w[free starter pro enterprise] }

  def jwt_payload
    { "sub" => id, "email" => email, "plan" => plan }
  end

  def self.from_omniauth(auth)
    where(provider: auth.provider, uid: auth.uid).first_or_create do |user|
      user.email = auth.info.email
      user.password = Devise.friendly_token[0, 20]
      user.name = auth.info.name
      user.avatar_url = auth.info.image
    end
  end

  def generate_magic_link_token!
    update!(
      magic_link_token: SecureRandom.urlsafe_base64(32),
      magic_link_sent_at: Time.current
    )
    magic_link_token
  end

  def magic_link_valid?
    magic_link_token.present? && magic_link_sent_at > 15.minutes.ago
  end

  def consume_magic_link!
    update!(magic_link_token: nil, magic_link_sent_at: nil)
  end
end
