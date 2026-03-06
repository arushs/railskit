# frozen_string_literal: true

require "rails_helper"

RSpec.describe Chunk, type: :model do
  describe "associations" do
    it { is_expected.to belong_to(:document) }
  end

  describe "validations" do
    it "requires content" do
      chunk = build(:chunk, content: nil)
      expect(chunk).not_to be_valid
    end

    it "requires position" do
      chunk = build(:chunk, position: nil)
      expect(chunk).not_to be_valid
    end

    it "requires non-negative position" do
      chunk = build(:chunk, position: -1)
      expect(chunk).not_to be_valid
    end
  end

  describe "#neighbors" do
    let(:document) { create(:document, :ready) }
    let!(:chunks) do
      3.times.map { |i| create(:chunk, document: document, position: i) }
    end

    it "returns surrounding chunks" do
      middle = chunks[1]
      neighbors = middle.neighbors(radius: 1)
      expect(neighbors.count).to eq(3)
    end

    it "handles edge chunks" do
      first = chunks[0]
      neighbors = first.neighbors(radius: 1)
      expect(neighbors.count).to eq(2) # position 0 and 1
    end
  end

  describe "delegation" do
    it "delegates title to document" do
      chunk = create(:chunk)
      expect(chunk.document_title).to eq(chunk.document.title)
    end
  end
end
