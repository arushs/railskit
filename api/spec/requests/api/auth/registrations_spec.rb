# frozen_string_literal: true

require "rails_helper"

RSpec.describe "POST /api/auth/signup", type: :request do
  let(:valid_params) do
    { user: { email: "new@example.com", password: "password123", password_confirmation: "password123", name: "Test" } }
  end

  describe "with valid params" do
    it "creates a user and returns 201" do
      expect {
        post "/api/auth/signup", params: valid_params, as: :json
      }.to change(User, :count).by(1)

      expect(response).to have_http_status(:created)
      body = response.parsed_body
      expect(body["user"]["email"]).to eq("new@example.com")
      expect(body["user"]["name"]).to eq("Test")
    end

    it "sets a JWT cookie" do
      post "/api/auth/signup", params: valid_params, as: :json
      expect(response.cookies["jwt"]).to be_present
    end
  end

  describe "with invalid params" do
    it "returns 422 for missing password" do
      post "/api/auth/signup",
           params: { user: { email: "bad@example.com", password: "" } },
           as: :json
      expect(response).to have_http_status(:unprocessable_entity)
      body = response.parsed_body
      expect(body["details"]).to be_present
    end

    it "returns 422 for duplicate email" do
      create(:user, email: "taken@example.com")
      post "/api/auth/signup",
           params: { user: { email: "taken@example.com", password: "password123", password_confirmation: "password123" } },
           as: :json
      expect(response).to have_http_status(:unprocessable_entity)
    end
  end
end
