# frozen_string_literal: true

require "rails_helper"

RSpec.describe Chunking::SemanticStrategy do
  subject(:strategy) { described_class.new }

  it "splits at sentence boundaries" do
    text = (1..20).map { |i| "This is sentence number #{i}." }.join(" ")
    chunks = strategy.chunk(text, size: 50, overlap: 0)
    expect(chunks.size).to be > 1
  end

  it "handles single sentence" do
    expect(strategy.chunk("One sentence.", size: 512, overlap: 0)).to eq(["One sentence."])
  end
end
