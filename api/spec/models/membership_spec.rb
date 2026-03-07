# frozen_string_literal: true

require "rails_helper"

RSpec.describe Membership, type: :model do
  describe "validations" do
    it { is_expected.to validate_presence_of(:role) }

    it "validates uniqueness of user per team" do
      team = create(:team)
      user = create(:user)
      create(:membership, team: team, user: user)
      dup = build(:membership, team: team, user: user)
      expect(dup).not_to be_valid
    end
  end

  describe "associations" do
    it { is_expected.to belong_to(:team) }
    it { is_expected.to belong_to(:user) }
  end

  describe "role enum" do
    it "defines member, admin, owner roles" do
      expect(described_class.roles.keys).to match_array(%w[member admin owner])
    end
  end
end
