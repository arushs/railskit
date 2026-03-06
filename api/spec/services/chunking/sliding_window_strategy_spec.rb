# frozen_string_literal: true

require "rails_helper"

RSpec.describe Chunking::SlidingWindowStrategy do
  subject(:strategy) { described_class.new }

  it "creates overlapping windows" do
    text = "word " * 500
    chunks = strategy.chunk(text, size: 100, overlap: 20)
    expect(chunks.size).to be > 1
  end

  it "returns single chunk for short text" do
    expect(strategy.chunk("Short.", size: 512, overlap: 50).size).to eq(1)
  end
end
