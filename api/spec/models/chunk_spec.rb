# frozen_string_literal: true

require "rails_helper"

RSpec.describe Chunk, type: :model do
  describe "validations" do
    it { is_expected.to validate_presence_of(:content) }
    it { is_expected.to validate_presence_of(:position) }
    it { is_expected.to validate_numericality_of(:position).only_integer.is_greater_than_or_equal_to(0) }
  end

  describe "associations" do
    it { is_expected.to belong_to(:document) }
  end

  describe "#neighbors" do
    let(:document) { create(:document) }
    let!(:chunk0) { create(:chunk, document: document, position: 0) }
    let!(:chunk1) { create(:chunk, document: document, position: 1) }
    let!(:chunk2) { create(:chunk, document: document, position: 2) }
    let!(:chunk3) { create(:chunk, document: document, position: 3) }

    it "returns surrounding chunks within radius" do
      neighbors = chunk1.neighbors(radius: 1)
      expect(neighbors).to contain_exactly(chunk0, chunk1, chunk2)
    end

    it "handles edge positions gracefully" do
      neighbors = chunk0.neighbors(radius: 1)
      expect(neighbors).to contain_exactly(chunk0, chunk1)
    end
  end

  describe "delegations" do
    let(:collection) { create(:collection, name: "KB") }
    let(:document) { create(:document, collection: collection, title: "My Doc") }
    let(:chunk) { create(:chunk, document: document) }

    it "delegates collection to document" do
      expect(chunk.collection).to eq(collection)
    end

    it "delegates document_title" do
      expect(chunk.document_title).to eq("My Doc")
    end
  end
end
