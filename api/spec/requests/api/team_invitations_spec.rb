# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Team Invitations API", type: :request do
  let(:owner) { create(:user) }
  let(:team) { create(:team, owner: owner) }

  before { sign_in owner }

  describe "GET /api/teams/:team_id/invitations" do
    it "lists pending invitations" do
      create(:team_invitation, team: team, inviter: owner)
      create(:team_invitation, :accepted, team: team, inviter: owner)

      get "/api/teams/#{team.id}/invitations", as: :json
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.size).to eq(1) # only pending
    end
  end

  describe "POST /api/teams/:team_id/invitations" do
    it "creates an invitation" do
      expect {
        post "/api/teams/#{team.id}/invitations",
             params: { email: "new@example.com", role: "member" }, as: :json
      }.to change(TeamInvitation, :count).by(1)

      expect(response).to have_http_status(:created)
      expect(response.parsed_body["email"]).to eq("new@example.com")
      expect(response.parsed_body["token"]).to be_present
    end

    it "rejects invalid email" do
      post "/api/teams/#{team.id}/invitations",
           params: { email: "bad", role: "member" }, as: :json
      expect(response).to have_http_status(:unprocessable_entity)
    end

    it "forbids regular members from inviting" do
      member = create(:user)
      create(:membership, team: team, user: member)
      sign_in member

      post "/api/teams/#{team.id}/invitations",
           params: { email: "x@test.com", role: "member" }, as: :json
      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "DELETE /api/teams/:team_id/invitations/:id" do
    it "cancels an invitation" do
      inv = create(:team_invitation, team: team, inviter: owner)

      expect {
        delete "/api/teams/#{team.id}/invitations/#{inv.id}", as: :json
      }.to change(TeamInvitation, :count).by(-1)

      expect(response).to have_http_status(:no_content)
    end
  end

  describe "POST /api/invitations/:token/accept" do
    it "accepts an invitation and creates membership" do
      inv = create(:team_invitation, team: team, inviter: owner)
      new_user = create(:user)
      sign_in new_user

      expect {
        post "/api/invitations/#{inv.token}/accept", as: :json
      }.to change(Membership, :count).by(1)

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["team"]["id"]).to eq(team.id)
      expect(inv.reload.accepted_at).to be_present
    end

    it "rejects expired invitation" do
      inv = create(:team_invitation, :expired, team: team, inviter: owner)
      new_user = create(:user)
      sign_in new_user

      post "/api/invitations/#{inv.token}/accept", as: :json
      expect(response).to have_http_status(:gone)
    end

    it "rejects if already a member" do
      inv = create(:team_invitation, team: team, inviter: owner, email: owner.email)
      sign_in owner

      post "/api/invitations/#{inv.token}/accept", as: :json
      expect(response).to have_http_status(:unprocessable_entity)
    end
  end
end
