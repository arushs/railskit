# frozen_string_literal: true

require "rails_helper"

RSpec.describe Chunking::ParagraphStrategy do
  subject(:strategy) { described_class.new }

  describe "#chunk" do
    it "splits by paragraphs" do
      text = "Para one.\n\nPara two.\n\nPara three."
      chunks = strategy.chunk(text, size: 1000, overlap: 0)
      expect(chunks.first).to include("Para one")
    end

    it "creates multiple chunks when text exceeds size" do
      text = (["A" * 400] * 10).join("\n\n")
      chunks = strategy.chunk(text, size: 200, overlap: 0)
      expect(chunks.size).to be > 1
    end

    it "handles empty text" do
      expect(strategy.chunk("", size: 512, overlap: 50)).to be_empty
    end
  end
end
