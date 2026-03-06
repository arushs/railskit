# frozen_string_literal: true

require "rails_helper"

RSpec.describe Embedding, type: :model do
  describe "associations" do
    it { should belong_to(:chunk) }
  end

  describe "validations" do
    subject { build(:embedding) }

    it { should validate_presence_of(:vector) }
    it { should validate_presence_of(:model_used) }
    it { should validate_uniqueness_of(:chunk_id) }
  end
end
