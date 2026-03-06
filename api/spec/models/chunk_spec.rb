# frozen_string_literal: true

require "rails_helper"

RSpec.describe Chunk, type: :model do
  describe "associations" do
    it { should belong_to(:document) }
    it { should have_one(:embedding).dependent(:destroy) }
  end

  describe "validations" do
    it { should validate_presence_of(:content) }
    it { should validate_presence_of(:position) }
    it { should validate_numericality_of(:position).is_greater_than_or_equal_to(0) }
  end

  describe "#estimated_token_count" do
    it "estimates tokens as content length / 4" do
      chunk = build(:chunk, content: "a" * 100)
      expect(chunk.estimated_token_count).to eq(25)
    end
  end

  describe "#document_collection" do
    it "delegates to document" do
      collection = create(:document_collection)
      document = create(:document, document_collection: collection)
      chunk = create(:chunk, document: document)
      expect(chunk.document_collection).to eq(collection)
    end
  end
end
