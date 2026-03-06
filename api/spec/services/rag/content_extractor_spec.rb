# frozen_string_literal: true

require "rails_helper"

RSpec.describe Rag::ContentExtractor do
  describe ".extract_html (private, tested via extract)" do
    it "strips HTML tags and scripts" do
      html = '<html><head><script>alert("x")</script></head><body><p>Hello <b>world</b></p></body></html>'
      result = described_class.send(:extract_html, html)
      expect(result).not_to include("<script>")
      expect(result).not_to include("<p>")
      expect(result).to include("Hello")
      expect(result).to include("world")
    end

    it "converts block elements to newlines" do
      html = "<p>Para one</p><p>Para two</p>"
      result = described_class.send(:extract_html, html)
      expect(result).to include("Para one")
      expect(result).to include("Para two")
    end

    it "decodes HTML entities" do
      html = "Tom &amp; Jerry &lt;3"
      result = described_class.send(:extract_html, html)
      expect(result).to include("Tom & Jerry <3")
    end
  end

  describe ".extract_url" do
    it "fetches and extracts content from a URL" do
      stub_request(:get, "https://example.com/page")
        .to_return(
          status: 200,
          body: "<html><body><p>Page content here</p></body></html>",
          headers: { "Content-Type" => "text/html" }
        )

      result = described_class.extract_url("https://example.com/page")
      expect(result[:content]).to include("Page content here")
    end

    it "raises on HTTP error" do
      stub_request(:get, "https://example.com/fail")
        .to_return(status: 404)

      expect {
        described_class.extract_url("https://example.com/fail")
      }.to raise_error(Rag::ContentExtractor::ExtractionError)
    end
  end
end
