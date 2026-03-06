# frozen_string_literal: true

require "rails_helper"

RSpec.describe DocumentParserAgent do
  let(:agent) { described_class.new }

  before do
    allow(RubyLLM).to receive(:chat).and_return(double("chat", with_instructions: nil, ask: nil))
  end

  describe "#parse with raw_text" do
    it "returns structured output from raw text" do
      text = "INTRODUCTION\nThis is the intro.\n\nCONCLUSION\nThis is the end."
      result = agent.parse(raw_text: text)

      expect(result[:full_text]).to eq(text)
      expect(result[:page_count]).to eq(1)
      expect(result[:pages]).to be_an(Array)
      expect(result[:pages].first[:page_number]).to eq(1)
      expect(result[:pages].first[:text]).to eq(text)
    end

    it "extracts sections from headings" do
      text = "OVERVIEW\nSome overview text.\n\nDETAILS\nSome detail text."
      result = agent.parse(raw_text: text)

      sections = result[:pages].first[:sections]
      expect(sections.length).to eq(2)
      expect(sections.first[:heading]).to eq("OVERVIEW")
      expect(sections.last[:heading]).to eq("DETAILS")
    end
  end

  describe "#parse with PDF file" do
    it "extracts pages from a PDF" do
      page1 = double("page", text: "Page one content")
      page2 = double("page", text: "Page two content")
      reader = double("reader", pages: [page1, page2])
      allow(PDF::Reader).to receive(:new).with("/tmp/test.pdf").and_return(reader)

      result = agent.parse(file_path: "/tmp/test.pdf")

      expect(result[:page_count]).to eq(2)
      expect(result[:pages].first[:page_number]).to eq(1)
      expect(result[:pages].first[:text]).to eq("Page one content")
      expect(result[:pages].last[:page_number]).to eq(2)
      expect(result[:full_text]).to include("Page one content")
      expect(result[:full_text]).to include("Page two content")
    end
  end

  describe "#parse with image file" do
    it "uses LLM vision to extract text" do
      llm_response = double("response", content: "Extracted text from image")
      chat = double("chat", with_instructions: nil)
      allow(chat).to receive(:ask).and_return(llm_response)
      allow(RubyLLM).to receive(:chat).and_return(chat)

      agent_with_chat = described_class.new
      result = agent_with_chat.parse(file_path: "/tmp/test.png")

      expect(result[:full_text]).to eq("Extracted text from image")
      expect(result[:page_count]).to eq(1)
    end
  end

  describe "#parse with no arguments" do
    it "raises ArgumentError" do
      expect { agent.parse }.to raise_error(ArgumentError, /Provide either file_path or raw_text/)
    end
  end
end
