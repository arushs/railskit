# frozen_string_literal: true

require "rails_helper"

RSpec.describe DocumentCollection, type: :model do
  describe "associations" do
    it { should have_many(:documents).dependent(:destroy) }
  end

  describe "validations" do
    subject { build(:document_collection) }

    it { should validate_presence_of(:name) }
    it { should validate_uniqueness_of(:name) }
    it { should validate_presence_of(:chunking_strategy) }
    it { should validate_inclusion_of(:chunking_strategy).in_array(%w[paragraph page semantic sliding_window markdown]) }
    it { should validate_presence_of(:chunk_size) }
    it { should validate_numericality_of(:chunk_size).is_greater_than(0) }
    it { should validate_presence_of(:chunk_overlap) }
    it { should validate_numericality_of(:chunk_overlap).is_greater_than_or_equal_to(0) }
    it { should validate_presence_of(:embedding_model) }

    it "validates overlap is less than size" do
      collection = build(:document_collection, chunk_size: 100, chunk_overlap: 100)
      expect(collection).not_to be_valid
      expect(collection.errors[:chunk_overlap]).to include("must be less than chunk_size")
    end
  end

  describe "defaults" do
    let(:collection) { DocumentCollection.new(name: "Test") }

    it "defaults chunking_strategy to paragraph" do
      expect(collection.chunking_strategy).to eq("paragraph")
    end

    it "defaults chunk_size to 512" do
      expect(collection.chunk_size).to eq(512)
    end
  end
end
