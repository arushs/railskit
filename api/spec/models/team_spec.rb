# frozen_string_literal: true

require "rails_helper"

RSpec.describe Team, type: :model do
  describe "validations" do
    it { is_expected.to validate_presence_of(:name) }

    it "validates slug uniqueness" do
      create(:team)
      team = build(:team, slug: Team.last.slug)
      expect(team).not_to be_valid
    end
  end

  describe "associations" do
    it { is_expected.to belong_to(:owner).class_name("User") }
    it { is_expected.to have_many(:memberships).dependent(:destroy) }
    it { is_expected.to have_many(:users).through(:memberships) }
    it { is_expected.to have_many(:team_invitations).dependent(:destroy) }
  end

  describe "slug generation" do
    it "auto-generates slug from name" do
      team = create(:team, name: "My Cool Team")
      expect(team.slug).to eq("my-cool-team")
    end

    it "does not overwrite an existing slug" do
      team = build(:team, name: "Test", slug: "custom-slug")
      team.save!
      expect(team.slug).to eq("custom-slug")
    end
  end
end
