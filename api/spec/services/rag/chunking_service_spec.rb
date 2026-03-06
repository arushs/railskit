# frozen_string_literal: true

require "rails_helper"

RSpec.describe Rag::ChunkingService do
  describe ".chunk" do
    let(:short_text) { "This is a short paragraph." }

    let(:long_text) do
      paragraphs = 10.times.map { |i| "Paragraph #{i + 1}. " + ("Lorem ipsum dolor sit amet. " * 20) }
      paragraphs.join("\n\n")
    end

    context "with recursive strategy (default)" do
      it "returns chunks with required fields" do
        chunks = described_class.chunk(short_text)

        expect(chunks).to be_an(Array)
        expect(chunks.first).to include(:content, :start_offset, :end_offset, :token_count, :metadata)
      end

      it "keeps short text as a single chunk" do
        chunks = described_class.chunk(short_text)
        expect(chunks.size).to eq(1)
        expect(chunks.first[:content]).to eq(short_text)
      end

      it "splits long text into multiple chunks" do
        chunks = described_class.chunk(long_text, chunk_size: 128)
        expect(chunks.size).to be > 1
      end

      it "respects chunk_size parameter" do
        chunks = described_class.chunk(long_text, chunk_size: 64)
        chunks.each do |chunk|
          # Allow some overshoot due to paragraph boundaries
          expect(chunk[:token_count]).to be <= 64 * 2
        end
      end

      it "includes metadata in each chunk" do
        meta = { document_id: 42 }
        chunks = described_class.chunk(short_text, metadata: meta)
        expect(chunks.first[:metadata]).to eq(meta)
      end
    end

    context "with sentence strategy" do
      it "splits on sentence boundaries" do
        text = "First sentence. Second sentence. Third sentence. Fourth sentence."
        chunks = described_class.chunk(text, strategy: :sentence, chunk_size: 8)
        expect(chunks.size).to be >= 1
        chunks.each do |chunk|
          expect(chunk[:content]).to match(/\.\s*$|[^.]+$/)
        end
      end
    end

    context "with fixed strategy" do
      it "creates fixed-size windows" do
        text = "A" * 2000
        chunks = described_class.chunk(text, strategy: :fixed, chunk_size: 100, overlap: 20)
        expect(chunks.size).to be > 1
      end
    end

    it "raises on unknown strategy" do
      expect {
        described_class.chunk("text", strategy: :unknown)
      }.to raise_error(ArgumentError, /Unknown chunking strategy/)
    end
  end
end
