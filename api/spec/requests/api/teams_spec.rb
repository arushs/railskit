# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Teams API", type: :request do
  let(:user) { create(:user) }

  before { sign_in user }

  describe "GET /api/teams" do
    it "lists user's teams" do
      create_list(:team, 2, owner: user)

      get "/api/teams", as: :json
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.size).to eq(2)
    end

    it "includes role and member_count" do
      create(:team, owner: user)

      get "/api/teams", as: :json
      team = response.parsed_body.first
      expect(team["role"]).to eq("owner")
      expect(team["member_count"]).to eq(1)
    end

    it "does not include other users' teams" do
      create(:team)

      get "/api/teams", as: :json
      expect(response.parsed_body).to be_empty
    end
  end

  describe "GET /api/teams/:id" do
    it "returns team details" do
      team = create(:team, owner: user)

      get "/api/teams/#{team.id}", as: :json
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["name"]).to eq(team.name)
      expect(response.parsed_body["role"]).to eq("owner")
    end
  end

  describe "POST /api/teams" do
    it "creates a team with owner membership" do
      expect {
        post "/api/teams", params: { name: "Engineering" }, as: :json
      }.to change(Team, :count).by(1)
        .and change(Membership, :count).by(1)

      expect(response).to have_http_status(:created)
      expect(response.parsed_body["name"]).to eq("Engineering")
      expect(response.parsed_body["slug"]).to eq("engineering")
    end

    it "rejects blank name" do
      post "/api/teams", params: { name: "" }, as: :json
      expect(response).to have_http_status(:unprocessable_entity)
    end
  end

  describe "PATCH /api/teams/:id" do
    it "updates team name as owner" do
      team = create(:team, owner: user)

      patch "/api/teams/#{team.id}", params: { name: "New Name" }, as: :json
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["name"]).to eq("New Name")
    end

    it "allows admin to update" do
      admin = user
      team = create(:team)
      create(:membership, :admin, team: team, user: admin)

      patch "/api/teams/#{team.id}", params: { name: "Updated" }, as: :json
      expect(response).to have_http_status(:ok)
    end

    it "forbids member from updating" do
      member = user
      team = create(:team)
      create(:membership, team: team, user: member)

      patch "/api/teams/#{team.id}", params: { name: "Hacked" }, as: :json
      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "DELETE /api/teams/:id" do
    it "deletes team as owner" do
      team = create(:team, owner: user)

      expect {
        delete "/api/teams/#{team.id}", as: :json
      }.to change(Team, :count).by(-1)

      expect(response).to have_http_status(:no_content)
    end

    it "forbids admin from deleting" do
      admin = user
      team = create(:team)
      create(:membership, :admin, team: team, user: admin)

      delete "/api/teams/#{team.id}", as: :json
      expect(response).to have_http_status(:forbidden)
    end
  end
end
