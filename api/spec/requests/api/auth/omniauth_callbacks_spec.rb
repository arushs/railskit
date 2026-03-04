# frozen_string_literal: true

require "rails_helper"

RSpec.describe "OAuth Callbacks", type: :request do
  before do
    OmniAuth.config.test_mode = true
  end

  after do
    OmniAuth.config.test_mode = false
    OmniAuth.config.mock_auth[:google_oauth2] = nil
  end

  describe "GET /api/auth/users/auth/google_oauth2/callback" do
    context "with valid OAuth data" do
      before do
        OmniAuth.config.mock_auth[:google_oauth2] = OmniAuth::AuthHash.new(
          provider: "google_oauth2",
          uid: "12345",
          info: {
            email: "google@example.com",
            name: "Google User",
            image: "https://example.com/avatar.jpg"
          }
        )
      end

      it "creates a user and redirects to frontend" do
        expect {
          get "/api/auth/users/auth/google_oauth2/callback"
        }.to change(User, :count).by(1)

        expect(response).to have_http_status(:redirect)
        expect(response.location).to include("auth/callback?success=true")
      end

      it "signs in existing OAuth user without creating duplicate" do
        create(:user, :with_oauth, provider: "google_oauth2", uid: "12345", email: "google@example.com")

        expect {
          get "/api/auth/users/auth/google_oauth2/callback"
        }.not_to change(User, :count)

        expect(response).to have_http_status(:redirect)
      end
    end

    context "with OAuth failure" do
      before do
        OmniAuth.config.mock_auth[:google_oauth2] = :invalid_credentials
      end

      it "redirects to frontend with error" do
        get "/api/auth/users/auth/google_oauth2/callback"
        expect(response).to have_http_status(:redirect)
        expect(response.location).to include("auth/callback?error=")
      end
    end
  end
end
