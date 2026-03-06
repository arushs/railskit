# frozen_string_literal: true

require "rails_helper"

RSpec.describe Chunking::PageStrategy do
  subject(:strategy) { described_class.new }

  it "splits by form feed" do
    chunks = strategy.chunk("Page 1\fPage 2\fPage 3", size: 1000, overlap: 0)
    expect(chunks.size).to eq(3)
  end

  it "falls back for no page breaks" do
    chunks = strategy.chunk("A" * 4000, size: 200, overlap: 50)
    expect(chunks.size).to be > 1
  end
end
