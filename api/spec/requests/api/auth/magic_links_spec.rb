# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Magic Links", type: :request do
  describe "POST /api/auth/magic_link" do
    let!(:user) { create(:user, email: "magic@example.com") }

    it "returns success regardless of whether email exists (prevents enumeration)" do
      post "/api/auth/magic_link", params: { email: "magic@example.com" }, as: :json
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["message"]).to include("magic link")
    end

    it "returns success for non-existent email" do
      post "/api/auth/magic_link", params: { email: "nobody@example.com" }, as: :json
      expect(response).to have_http_status(:ok)
    end

    it "generates a magic link token for the user" do
      post "/api/auth/magic_link", params: { email: "magic@example.com" }, as: :json
      expect(user.reload.magic_link_token).to be_present
    end
  end

  describe "POST /api/auth/magic_link/verify" do
    let!(:user) { create(:user, :with_magic_link) }

    it "signs in user with valid token" do
      post "/api/auth/magic_link/verify",
           params: { token: user.magic_link_token },
           as: :json

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body["user"]["email"]).to eq(user.email)
      expect(response.cookies["jwt"]).to be_present
    end

    it "consumes the token after use" do
      token = user.magic_link_token
      post "/api/auth/magic_link/verify", params: { token: token }, as: :json
      expect(user.reload.magic_link_token).to be_nil
    end

    it "rejects expired token" do
      user = create(:user, :with_expired_magic_link)
      post "/api/auth/magic_link/verify",
           params: { token: user.magic_link_token },
           as: :json

      expect(response).to have_http_status(:unauthorized)
    end

    it "rejects invalid token" do
      post "/api/auth/magic_link/verify",
           params: { token: "bogus" },
           as: :json

      expect(response).to have_http_status(:unauthorized)
    end
  end
end
