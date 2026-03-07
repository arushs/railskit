# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Two-Factor Authentication API", type: :request do
  let(:user) { create(:user, :confirmed, password: "password123") }
  let(:headers) { { "Content-Type" => "application/json" } }
  let(:auth_headers) do
    token = Warden::JWTAuth::UserEncoder.new.call(user, :user, nil).first
    headers.merge("Authorization" => "Bearer #{token}")
  end

  describe "POST /api/auth/two_factor/enable" do
    it "returns OTP URI for QR code" do
      post "/api/auth/two_factor/enable", headers: auth_headers
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["otp_uri"]).to start_with("otpauth://totp/")
    end

    it "rejects if already enabled" do
      user.update!(otp_secret: User.generate_otp_secret, otp_required_for_login: true)
      post "/api/auth/two_factor/enable", headers: auth_headers
      expect(response).to have_http_status(:unprocessable_entity)
    end

    it "requires authentication" do
      post "/api/auth/two_factor/enable", headers: headers
      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "POST /api/auth/two_factor/verify" do
    before { user.enable_two_factor! }

    it "confirms 2FA with valid OTP" do
      valid_otp = ROTP::TOTP.new(user.otp_secret).now
      post "/api/auth/two_factor/verify",
        params: { otp_code: valid_otp }.to_json,
        headers: auth_headers
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["backup_codes"]).to be_an(Array)
      expect(json["backup_codes"].length).to eq(10)
      expect(user.reload.otp_required_for_login).to be true
    end

    it "rejects invalid OTP" do
      post "/api/auth/two_factor/verify",
        params: { otp_code: "000000" }.to_json,
        headers: auth_headers
      expect(response).to have_http_status(:unprocessable_entity)
    end
  end

  describe "POST /api/auth/two_factor/disable" do
    let(:user) { create(:user, :with_2fa, password: "password123") }

    it "disables 2FA with correct password" do
      post "/api/auth/two_factor/disable",
        params: { password: "password123" }.to_json,
        headers: auth_headers
      expect(response).to have_http_status(:ok)
      expect(user.reload.otp_required_for_login).to be false
    end

    it "rejects with wrong password" do
      post "/api/auth/two_factor/disable",
        params: { password: "wrong" }.to_json,
        headers: auth_headers
      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "POST /api/auth/two_factor/backup_codes" do
    let(:user) { create(:user, :with_2fa, password: "password123") }

    it "regenerates backup codes" do
      old_codes = user.otp_backup_codes.dup
      post "/api/auth/two_factor/backup_codes",
        params: { password: "password123" }.to_json,
        headers: auth_headers
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["backup_codes"]).not_to eq(old_codes)
    end
  end

  describe "POST /api/auth/two_factor/challenge (login flow)" do
    let(:user) { create(:user, :with_2fa, password: "password123") }

    it "login returns requires_2fa when 2FA enabled" do
      post "/api/auth/login",
        params: { user: { email: user.email, password: "password123" } }.to_json,
        headers: headers
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["requires_2fa"]).to be true
      expect(json["temp_token"]).to be_present
    end

    it "completes login with valid OTP" do
      # First: login to get temp token
      post "/api/auth/login",
        params: { user: { email: user.email, password: "password123" } }.to_json,
        headers: headers
      temp_token = JSON.parse(response.body)["temp_token"]

      # Second: challenge with OTP
      valid_otp = ROTP::TOTP.new(user.otp_secret).now
      post "/api/auth/two_factor/challenge",
        params: { temp_token: temp_token, otp_code: valid_otp }.to_json,
        headers: headers
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["user"]).to be_present
      expect(json["token"]).to be_present
    end

    it "completes login with valid backup code" do
      post "/api/auth/login",
        params: { user: { email: user.email, password: "password123" } }.to_json,
        headers: headers
      temp_token = JSON.parse(response.body)["temp_token"]

      backup_code = user.otp_backup_codes.first
      post "/api/auth/two_factor/challenge",
        params: { temp_token: temp_token, otp_code: backup_code }.to_json,
        headers: headers
      expect(response).to have_http_status(:ok)
    end

    it "rejects invalid OTP" do
      post "/api/auth/login",
        params: { user: { email: user.email, password: "password123" } }.to_json,
        headers: headers
      temp_token = JSON.parse(response.body)["temp_token"]

      post "/api/auth/two_factor/challenge",
        params: { temp_token: temp_token, otp_code: "000000" }.to_json,
        headers: headers
      expect(response).to have_http_status(:unauthorized)
    end

    it "rejects expired temp token" do
      payload = { sub: user.id, purpose: "2fa_challenge", exp: 1.minute.ago.to_i }
      expired_token = JWT.encode(payload, Rails.application.credentials.secret_key_base, "HS256")

      post "/api/auth/two_factor/challenge",
        params: { temp_token: expired_token, otp_code: "123456" }.to_json,
        headers: headers
      expect(response).to have_http_status(:unauthorized)
    end
  end
end
