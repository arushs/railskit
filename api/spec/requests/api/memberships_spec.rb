# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Memberships API", type: :request do
  let(:owner) { create(:user) }
  let(:team) { create(:team, owner: owner) }

  before { sign_in owner }

  describe "GET /api/teams/:team_id/memberships" do
    it "lists team members with user details" do
      member = create(:user)
      create(:membership, team: team, user: member)

      get "/api/teams/#{team.id}/memberships", as: :json
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.size).to eq(2) # owner + member

      names = response.parsed_body.map { |m| m["user"]["email"] }
      expect(names).to include(owner.email, member.email)
    end
  end

  describe "PATCH /api/teams/:team_id/memberships/:id" do
    it "changes member role to admin" do
      member = create(:user)
      membership = create(:membership, team: team, user: member)

      patch "/api/teams/#{team.id}/memberships/#{membership.id}",
            params: { role: "admin" }, as: :json
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["role"]).to eq("admin")
    end

    it "cannot change owner role" do
      owner_membership = team.memberships.find_by(user: owner)

      patch "/api/teams/#{team.id}/memberships/#{owner_membership.id}",
            params: { role: "member" }, as: :json
      expect(response).to have_http_status(:forbidden)
    end

    it "forbids regular members from changing roles" do
      member = create(:user)
      create(:membership, team: team, user: member)
      other = create(:user)
      other_membership = create(:membership, team: team, user: other)

      sign_in member
      patch "/api/teams/#{team.id}/memberships/#{other_membership.id}",
            params: { role: "admin" }, as: :json
      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "DELETE /api/teams/:team_id/memberships/:id" do
    it "removes a member" do
      member = create(:user)
      membership = create(:membership, team: team, user: member)

      expect {
        delete "/api/teams/#{team.id}/memberships/#{membership.id}", as: :json
      }.to change(Membership, :count).by(-1)

      expect(response).to have_http_status(:no_content)
    end

    it "cannot remove the owner" do
      owner_membership = team.memberships.find_by(user: owner)

      delete "/api/teams/#{team.id}/memberships/#{owner_membership.id}", as: :json
      expect(response).to have_http_status(:forbidden)
    end
  end
end
