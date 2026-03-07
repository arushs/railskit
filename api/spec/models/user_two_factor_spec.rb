# frozen_string_literal: true

require "rails_helper"

RSpec.describe User, "two-factor authentication" do
  let(:user) { create(:user, :confirmed) }

  describe "#enable_two_factor!" do
    it "sets otp_secret but doesn't require login yet" do
      user.enable_two_factor!
      expect(user.otp_secret).to be_present
      expect(user.otp_required_for_login).to be false
    end
  end

  describe "#confirm_two_factor!" do
    before { user.enable_two_factor! }

    it "enables 2FA with valid OTP and returns backup codes" do
      valid_otp = ROTP::TOTP.new(user.otp_secret).now
      codes = user.confirm_two_factor!(valid_otp)
      expect(codes).to be_an(Array)
      expect(codes.length).to eq(10)
      expect(user.reload.otp_required_for_login).to be true
    end

    it "returns false with invalid OTP" do
      result = user.confirm_two_factor!("000000")
      expect(result).to be false
      expect(user.reload.otp_required_for_login).to be false
    end
  end

  describe "#disable_two_factor!" do
    let(:user) { create(:user, :with_2fa) }

    it "clears all 2FA fields" do
      user.disable_two_factor!
      user.reload
      expect(user.otp_required_for_login).to be false
      expect(user.otp_secret).to be_nil
      expect(user.otp_backup_codes).to be_nil
    end
  end

  describe "#two_factor_enabled?" do
    it "returns false by default" do
      expect(user.two_factor_enabled?).to be false
    end

    it "returns true when otp_required_for_login is set" do
      user = create(:user, :with_2fa)
      expect(user.two_factor_enabled?).to be true
    end
  end

  describe "#consume_otp_backup_code!" do
    let(:user) { create(:user, :with_2fa) }

    it "consumes a valid backup code" do
      code = user.otp_backup_codes.first
      expect(user.consume_otp_backup_code!(code)).to be true
      expect(user.reload.otp_backup_codes).not_to include(code)
    end

    it "rejects invalid backup code" do
      expect(user.consume_otp_backup_code!("invalid")).to be false
    end
  end

  describe "#generate_two_factor_temp_token!" do
    it "generates a JWT that can be decoded back" do
      token = user.generate_two_factor_temp_token!
      decoded_user = User.from_two_factor_temp_token(token)
      expect(decoded_user).to eq(user)
    end
  end

  describe ".from_two_factor_temp_token" do
    it "returns nil for invalid token" do
      expect(User.from_two_factor_temp_token("garbage")).to be_nil
    end

    it "returns nil for expired token" do
      payload = { sub: user.id, purpose: "2fa_challenge", exp: 1.minute.ago.to_i }
      token = JWT.encode(payload, Rails.application.credentials.secret_key_base, "HS256")
      expect(User.from_two_factor_temp_token(token)).to be_nil
    end
  end

  describe "#two_factor_qr_uri" do
    before { user.enable_two_factor! }

    it "returns a valid otpauth URI" do
      uri = user.two_factor_qr_uri
      expect(uri).to start_with("otpauth://totp/")
    end
  end
end
