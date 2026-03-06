# frozen_string_literal: true

require "rails_helper"

RSpec.describe TextExtractor do
  describe ".supported?" do
    it "recognizes PDF content type" do
      expect(TextExtractor.supported?("application/pdf")).to be true
    end

    it "recognizes plain text" do
      expect(TextExtractor.supported?("text/plain")).to be true
    end

    it "recognizes file extensions" do
      expect(TextExtractor.supported?(".pdf")).to be true
      expect(TextExtractor.supported?(".txt")).to be true
      expect(TextExtractor.supported?(".md")).to be true
    end

    it "rejects unsupported formats" do
      expect(TextExtractor.supported?("application/zip")).to be false
    end
  end

  describe ".extract" do
    let(:collection) { create(:document_collection) }

    context "with plain text" do
      let(:document) do
        doc = create(:document, name: "test.txt", content_type: "text/plain", document_collection: collection)
        doc.file.attach(io: StringIO.new("Hello world"), filename: "test.txt", content_type: "text/plain")
        doc
      end

      it "extracts plain text content" do
        expect(TextExtractor.extract(document)).to eq("Hello world")
      end
    end

    context "with unsupported format" do
      let(:document) do
        doc = create(:document, name: "file.xyz", content_type: "application/octet-stream", document_collection: collection)
        doc.file.attach(io: StringIO.new("data"), filename: "file.xyz", content_type: "application/octet-stream")
        doc
      end

      it "raises UnsupportedFormatError" do
        expect { TextExtractor.extract(document) }.to raise_error(TextExtractor::UnsupportedFormatError)
      end
    end
  end
end
