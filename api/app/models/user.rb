# frozen_string_literal: true

class User < ApplicationRecord
  devise :two_factor_authenticatable,
         :registerable, :recoverable,
         :rememberable, :trackable, :validatable,
         :confirmable, :lockable,
         :jwt_authenticatable, :omniauthable,
         jwt_revocation_strategy: JwtDenylist,
         omniauth_providers: [:google_oauth2]

  has_many :chats, dependent: :destroy

  validates :plan, inclusion: { in: %w[free starter pro enterprise] }

  # Confirmable config — respect railskit.yml
  def self.allow_unconfirmed_access_for
    if RailsKit.config.auth&.require_email_confirmation == false
      nil # Never block unconfirmed
    else
      3.days
    end
  end

  # Override to skip confirmation requirement when disabled in config
  def confirmation_required?
    return false if RailsKit.config.auth&.require_email_confirmation == false
    super
  end

  def jwt_payload
    { "sub" => id, "email" => email, "plan" => plan }
  end

  def self.from_omniauth(auth)
    where(provider: auth.provider, uid: auth.uid).first_or_create do |user|
      user.email = auth.info.email
      user.password = Devise.friendly_token[0, 20]
      user.name = auth.info.name
      user.avatar_url = auth.info.image
      user.confirmed_at = Time.current # OAuth users are auto-confirmed
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

  # ---- Two-Factor Authentication ----

  def two_factor_enabled?
    otp_required_for_login?
  end

  def enable_two_factor!
    update!(otp_secret: User.generate_otp_secret, otp_required_for_login: false)
  end

  def confirm_two_factor!(otp_code)
    return false unless validate_and_consume_otp!(otp_code)
    update!(otp_required_for_login: true)
    generate_otp_backup_codes!
  end

  def disable_two_factor!
    update!(
      otp_required_for_login: false,
      otp_secret: nil,
      consumed_timestep: nil,
      otp_backup_codes: nil
    )
  end

  def generate_otp_backup_codes!
    codes = Array.new(10) { SecureRandom.hex(4) }
    update!(otp_backup_codes: codes)
    codes
  end

  def consume_otp_backup_code!(code)
    return false unless otp_backup_codes&.include?(code)
    remaining = otp_backup_codes - [code]
    update!(otp_backup_codes: remaining)
    true
  end

  def two_factor_qr_uri
    issuer = RailsKit.config.app&.name || "RailsKit"
    otp_provisioning_uri(email, issuer: issuer)
  end

  # Generate a temporary token for 2FA challenge flow
  def generate_two_factor_temp_token!
    payload = { sub: id, purpose: "2fa_challenge", exp: 5.minutes.from_now.to_i }
    JWT.encode(payload, jwt_secret_key, "HS256")
  end

  def self.from_two_factor_temp_token(token)
    payload = JWT.decode(token, jwt_secret_key, true, algorithm: "HS256").first
    return nil unless payload["purpose"] == "2fa_challenge"
    find_by(id: payload["sub"])
  rescue JWT::DecodeError, JWT::ExpiredSignature
    nil
  end

  private

  def jwt_secret_key
    self.class.jwt_secret_key
  end

  def self.jwt_secret_key
    Rails.application.credentials.secret_key_base || Rails.application.secret_key_base || ENV.fetch("SECRET_KEY_BASE", "dev-secret-key-for-jwt")
  end
end
