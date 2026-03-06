# frozen_string_literal: true

require "rails_helper"

RSpec.describe Chunking::MarkdownStrategy do
  subject(:strategy) { described_class.new }

  it "splits by headers" do
    text = "# Intro\nContent.\n\n## Setup\nMore.\n\n## Config\nConf."
    chunks = strategy.chunk(text, size: 1000, overlap: 0)
    expect(chunks.size).to eq(3)
  end

  it "handles text without headers" do
    expect(strategy.chunk("No headers.", size: 512, overlap: 0).size).to eq(1)
  end
end
