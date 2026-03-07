# frozen_string_literal: true

require "rails_helper"

RSpec.describe TeamInvitation, type: :model do
  describe "validations" do
    it { is_expected.to validate_presence_of(:email) }
    it { is_expected.to validate_presence_of(:role) }

    it "validates email format" do
      inv = build(:team_invitation, email: "not-an-email")
      expect(inv).not_to be_valid
    end

    it "validates role inclusion" do
      inv = build(:team_invitation, role: "superadmin")
      expect(inv).not_to be_valid
    end
  end

  describe "associations" do
    it { is_expected.to belong_to(:team) }
    it { is_expected.to belong_to(:inviter).class_name("User") }
  end

  describe "auto-generation" do
    it "generates a token on create" do
      inv = create(:team_invitation)
      expect(inv.token).to be_present
      expect(inv.token.length).to be > 20
    end

    it "sets expires_at 7 days out" do
      inv = create(:team_invitation)
      expect(inv.expires_at).to be_within(1.minute).of(7.days.from_now)
    end
  end

  describe "scopes" do
    it ".pending excludes accepted and expired" do
      team = create(:team)
      inviter = team.owner
      pending = create(:team_invitation, team: team, inviter: inviter)
      create(:team_invitation, :accepted, team: team, inviter: inviter)
      create(:team_invitation, :expired, team: team, inviter: inviter)

      expect(TeamInvitation.pending).to eq([pending])
    end
  end

  describe "#expired?" do
    it "returns true when past expires_at" do
      inv = build(:team_invitation, expires_at: 1.hour.ago)
      expect(inv).to be_expired
    end

    it "returns false when before expires_at" do
      inv = build(:team_invitation, expires_at: 1.hour.from_now)
      expect(inv).not_to be_expired
    end
  end
end
