# frozen_string_literal: true

require "rails_helper"

RSpec.describe DocumentExtractorAgent do
  let(:schema) do
    [
      { field_name: "invoice_number", type: "string", description: "The invoice number", required: true },
      { field_name: "total_amount", type: "number", description: "Total amount due", required: true }
    ]
  end

  let(:llm_response) do
    double("response", content: <<~JSON)
      {
        "fields": {
          "invoice_number": {"value": "INV-2024-001", "confidence": 0.98, "source_text": "Invoice #INV-2024-001"},
          "total_amount": {"value": 1500.00, "confidence": 0.95, "source_text": "Total Due: $1,500.00"}
        }
      }
    JSON
  end

  let(:chat) { double("chat", with_instructions: nil, ask: llm_response) }

  before do
    allow(RubyLLM).to receive(:chat).and_return(chat)
  end

  describe "#extract" do
    it "returns extracted fields with confidence and source_text" do
      agent = described_class.new
      result = agent.extract(text: "Invoice #INV-2024-001\nTotal Due: $1,500.00", schema: schema)

      fields = result[:fields]
      expect(fields[:invoice_number][:value]).to eq("INV-2024-001")
      expect(fields[:invoice_number][:confidence]).to eq(0.98)
      expect(fields[:invoice_number][:source_text]).to eq("Invoice #INV-2024-001")
      expect(fields[:total_amount][:value]).to eq(1500.00)
      expect(fields[:total_amount][:confidence]).to eq(0.95)
    end

    it "fills missing fields with nil values" do
      partial_response = double("response", content: '{"fields": {"invoice_number": {"value": "123", "confidence": 0.9, "source_text": "123"}}}')
      allow(chat).to receive(:ask).and_return(partial_response)

      agent = described_class.new
      result = agent.extract(text: "Invoice 123", schema: schema)

      expect(result[:fields][:total_amount][:value]).to be_nil
      expect(result[:fields][:total_amount][:confidence]).to eq(0.0)
      expect(result[:fields][:total_amount][:source_text]).to eq("")
    end

    it "clamps confidence to 0-1 range" do
      extreme_response = double("response", content: '{"fields": {"invoice_number": {"value": "X", "confidence": 2.5, "source_text": "X"}, "total_amount": {"value": 0, "confidence": -1, "source_text": ""}}}')
      allow(chat).to receive(:ask).and_return(extreme_response)

      agent = described_class.new
      result = agent.extract(text: "test", schema: schema)

      expect(result[:fields][:invoice_number][:confidence]).to eq(1.0)
      expect(result[:fields][:total_amount][:confidence]).to eq(0.0)
    end

    it "handles JSON parse errors gracefully" do
      bad_response = double("response", content: "not json")
      allow(chat).to receive(:ask).and_return(bad_response)

      agent = described_class.new
      result = agent.extract(text: "test", schema: schema)

      expect(result[:fields][:invoice_number][:value]).to be_nil
      expect(result[:fields][:total_amount][:value]).to be_nil
    end

    it "strips markdown fencing from response" do
      fenced_response = double("response", content: "```json\n{\"fields\": {\"invoice_number\": {\"value\": \"F-001\", \"confidence\": 0.9, \"source_text\": \"F-001\"}, \"total_amount\": {\"value\": 100, \"confidence\": 0.8, \"source_text\": \"$100\"}}}\n```")
      allow(chat).to receive(:ask).and_return(fenced_response)

      agent = described_class.new
      result = agent.extract(text: "Invoice F-001, Total $100", schema: schema)

      expect(result[:fields][:invoice_number][:value]).to eq("F-001")
      expect(result[:fields][:total_amount][:value]).to eq(100)
    end

    it "raises on blank text" do
      agent = described_class.new
      expect { agent.extract(text: "", schema: schema) }.to raise_error(ArgumentError)
    end

    it "raises on blank schema" do
      agent = described_class.new
      expect { agent.extract(text: "test", schema: []) }.to raise_error(ArgumentError)
    end
  end

  describe "#ask" do
    it "uses default schema when called via ask" do
      agent = described_class.new
      result = agent.ask("Some document text")
      expect(result).to have_key(:fields)
    end
  end

  describe "AsTool integration" do
    it "can be converted to a tool" do
      tool_class = described_class.to_tool
      expect(tool_class.ancestors).to include(RubyLLM::Tool)
    end
  end
end
