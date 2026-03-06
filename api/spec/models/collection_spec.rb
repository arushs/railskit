# frozen_string_literal: true

require "rails_helper"

RSpec.describe Collection, type: :model do
  let(:user) { create(:user) }
  let(:collection) { create(:collection, user: user) }

  describe "associations" do
    it { is_expected.to belong_to(:user).optional }
    it { is_expected.to have_many(:documents).dependent(:destroy) }
  end

  describe "validations" do
    it "requires a name" do
      collection = build(:collection, name: nil)
      expect(collection).not_to be_valid
    end

    it "auto-generates a unique slug" do
      c = create(:collection, name: "My Docs", user: user)
      expect(c.slug).to eq("my-docs")
    end

    it "enforces slug uniqueness" do
      create(:collection, name: "Test", user: user)
      dupe = build(:collection, name: "Test", slug: Collection.last.slug, user: user)
      expect(dupe).not_to be_valid
    end
  end

  describe ".for_user" do
    it "scopes to user's collections" do
      other = create(:user)
      create(:collection, user: other)
      mine = create(:collection, user: user)

      expect(Collection.for_user(user)).to contain_exactly(mine)
    end
  end
end
