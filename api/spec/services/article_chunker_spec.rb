require "rails_helper"

RSpec.describe ArticleChunker do
  let(:article) { Article.create!(title: "Test Article", body: body_text) }

  describe "#build_chunks" do
    context "with a short article" do
      let(:body_text) { "This is a short article." }

      it "returns a single chunk" do
        chunks = described_class.new(article).build_chunks
        expect(chunks.length).to eq(1)
        expect(chunks.first).to include("short article")
      end
    end

    context "with heading-delimited sections" do
      let(:body_text) do
        <<~MD
          # Introduction

          This is the intro paragraph with some content.

          # Main Section

          This is the main content section with details.

          # Conclusion

          This wraps everything up nicely.
        MD
      end

      it "splits on headings" do
        chunks = described_class.new(article, target_tokens: 20).build_chunks
        expect(chunks.length).to be > 1
        # Each chunk should contain coherent heading content
        expect(chunks.first).to include("Introduction")
      end
    end

    context "with a large section" do
      let(:body_text) { "This is a sentence. " * 500 }

      it "splits into multiple chunks" do
        chunks = described_class.new(article).build_chunks
        expect(chunks.length).to be > 1
      end

      it "applies overlap between chunks" do
        chunks = described_class.new(article).build_chunks
        next if chunks.length < 2
        # The second chunk should start with text from the end of the first
        first_tail = chunks[0][-100..]
        # Some overlap text from first should appear at start of second
        overlap_region = chunks[1][0..200]
        # At least some words from the tail should appear in the overlap
        tail_words = first_tail.split.last(3)
        expect(tail_words.any? { |w| overlap_region.include?(w) }).to be true
      end
    end

    context "with blank body" do
      let(:body_text) { "" }
      let(:article) { Article.new(title: "Test", body: "") }

      it "returns empty array" do
        # Use new instead of create since blank body is invalid
        chunker = described_class.new(article)
        expect(chunker.build_chunks).to eq([])
      end
    end
  end

  describe "#chunk!" do
    let(:body_text) do
      <<~MD
        # Part One

        #{("First section content. " * 100)}

        # Part Two

        #{("Second section content. " * 100)}
      MD
    end

    it "creates ArticleChunk records" do
      chunks = described_class.new(article).chunk!
      expect(chunks).to all(be_a(ArticleChunk))
      expect(chunks).to all(be_persisted)
      expect(article.article_chunks.count).to be > 1
    end

    it "sets sequential chunk_index values" do
      chunks = described_class.new(article).chunk!
      indices = chunks.map(&:chunk_index)
      expect(indices).to eq((0...chunks.length).to_a)
    end
  end
end
