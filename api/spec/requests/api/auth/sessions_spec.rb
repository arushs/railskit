# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Sessions", type: :request do
  let!(:user) { create(:user, email: "login@example.com", password: "password123") }

  describe "POST /api/auth/login (sign_in)" do
    it "returns user and JWT on valid credentials" do
      post "/api/auth/login",
           params: { user: { email: "login@example.com", password: "password123" } },
           as: :json

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body["user"]["email"]).to eq("login@example.com")
      expect(response.cookies["jwt"]).to be_present
    end

    it "returns 401 on invalid credentials" do
      post "/api/auth/login",
           params: { user: { email: "login@example.com", password: "wrong" } },
           as: :json

      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "DELETE /api/auth/logout (sign_out)" do
    it "clears the JWT cookie" do
      # Sign in first
      post "/api/auth/login",
           params: { user: { email: "login@example.com", password: "password123" } },
           as: :json
      jwt = response.cookies["jwt"]

      # Sign out
      delete "/api/auth/logout",
             headers: { "Cookie" => "jwt=#{jwt}" }

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body["message"]).to eq("Signed out")
    end
  end
end
