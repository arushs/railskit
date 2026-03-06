# frozen_string_literal: true

require "rails_helper"

RSpec.describe Collection, type: :model do
  describe "validations" do
    subject { build(:collection) }

    it { is_expected.to validate_presence_of(:name) }
    it { is_expected.to validate_uniqueness_of(:name) }
  end

  describe "associations" do
    it { is_expected.to have_many(:documents).dependent(:destroy) }
    it { is_expected.to have_many(:chunks).through(:documents) }
    it { is_expected.to belong_to(:user).optional }
  end
end
