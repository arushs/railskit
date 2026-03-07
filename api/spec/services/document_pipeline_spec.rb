# frozen_string_literal: true

require "rails_helper"

RSpec.describe DocumentPipeline do
  let(:categories) do
    [
      { name: "invoice", description: "An invoice or bill", examples: ["Invoice"] },
      { name: "contract", description: "A legal contract", examples: ["Agreement"] }
    ]
  end

  let(:extraction_schemas) do
    {
      "invoice" => [
        { field_name: "invoice_number", type: "string", description: "Invoice number", required: true },
        { field_name: "total_amount", type: "number", description: "Total amount", required: true }
      ],
      "contract" => [
        { field_name: "parties", type: "array", description: "Contracting parties", required: true }
      ]
    }
  end

  let(:config) do
    described_class::Config.new(
      categories: categories,
      extraction_schemas: extraction_schemas
    )
  end

  let(:parsed_result) do
    {
      pages: [{ page_number: 1, text: "Invoice #123\nTotal: $500", sections: [] }],
      full_text: "Invoice #123\nTotal: $500",
      page_count: 1
    }
  end

  let(:classification_result) do
    { classification: "invoice", confidence: 0.95, reasoning: "Contains invoice number" }
  end

  let(:extraction_result) do
    {
      fields: {
        invoice_number: { value: "123", confidence: 0.9, source_text: "Invoice #123" },
        total_amount: { value: 500, confidence: 0.85, source_text: "Total: $500" }
      }
    }
  end

  let(:parser) { instance_double(DocumentParserAgent, parse: parsed_result) }
  let(:classifier) { instance_double(DocumentClassifierAgent, classify: classification_result) }
  let(:extractor) { instance_double(DocumentExtractorAgent, extract: extraction_result) }

  before do
    allow(DocumentParserAgent).to receive(:new).and_return(parser)
    allow(DocumentClassifierAgent).to receive(:new).and_return(classifier)
    allow(DocumentExtractorAgent).to receive(:new).and_return(extractor)
  end

  describe "#process" do
    it "runs the full pipeline: parse → classify → extract" do
      result = described_class.new(config).process(raw_text: "Invoice #123\nTotal: $500")

      expect(result[:parsed][:full_text]).to eq("Invoice #123\nTotal: $500")
      expect(result[:classification][:classification]).to eq("invoice")
      expect(result[:extracted][:fields][:invoice_number][:value]).to eq("123")
    end

    it "passes file_path to parser" do
      expect(parser).to receive(:parse).with(file_path: "/tmp/doc.pdf", raw_text: nil)

      described_class.new(config).process(file_path: "/tmp/doc.pdf")
    end

    it "selects extraction schema based on classification" do
      contract_classification = { classification: "contract", confidence: 0.9, reasoning: "Legal document" }
      allow(classifier).to receive(:classify).and_return(contract_classification)

      contract_extraction = { fields: { parties: { value: ["A", "B"], confidence: 0.8, source_text: "A and B" } } }
      allow(extractor).to receive(:extract).and_return(contract_extraction)

      result = described_class.new(config).process(raw_text: "Agreement between A and B")

      expect(result[:classification][:classification]).to eq("contract")
      expect(result[:extracted][:fields][:parties][:value]).to eq(["A", "B"])
    end

    it "skips parse when skip_parse is true and raw_text is provided" do
      skip_config = described_class::Config.new(
        categories: categories,
        extraction_schemas: extraction_schemas,
        skip_parse: true
      )

      expect(DocumentParserAgent).not_to receive(:new)

      result = described_class.new(skip_config).process(raw_text: "pre-extracted text")
      expect(result[:parsed][:full_text]).to eq("pre-extracted text")
    end

    it "skips classify when skip_classify is true" do
      skip_config = described_class::Config.new(
        categories: categories,
        extraction_schemas: extraction_schemas,
        skip_classify: true
      )

      expect(DocumentClassifierAgent).not_to receive(:new)

      result = described_class.new(skip_config).process(raw_text: "text")
      expect(result[:classification]).to be_nil
    end

    it "skips extract when skip_extract is true" do
      skip_config = described_class::Config.new(
        categories: categories,
        extraction_schemas: extraction_schemas,
        skip_extract: true
      )

      expect(DocumentExtractorAgent).not_to receive(:new)

      result = described_class.new(skip_config).process(raw_text: "text")
      expect(result[:extracted]).to be_nil
    end

    it "returns empty fields when no schema matches classification" do
      no_schema_config = described_class::Config.new(
        categories: categories,
        extraction_schemas: {}
      )

      result = described_class.new(no_schema_config).process(raw_text: "text")
      expect(result[:extracted][:fields]).to eq({})
    end

    it "returns unknown classification when no categories configured" do
      empty_config = described_class::Config.new(
        categories: [],
        extraction_schemas: {}
      )

      result = described_class.new(empty_config).process(raw_text: "text")
      expect(result[:classification][:classification]).to eq("unknown")
      expect(result[:classification][:confidence]).to eq(0.0)
    end

    it "uses 'default' schema when classification has no specific schema" do
      default_schema_config = described_class::Config.new(
        categories: categories,
        extraction_schemas: {
          "default" => [
            { field_name: "title", type: "string", description: "Doc title", required: false }
          ]
        }
      )

      # Classifier returns "invoice" but there's no "invoice" schema, only "default"
      result = described_class.new(default_schema_config).process(raw_text: "text")
      expect(extractor).to have_received(:extract)
    end
  end

  describe "Config" do
    it "has sensible defaults" do
      c = described_class::Config.new
      expect(c.categories).to eq([])
      expect(c.extraction_schemas).to eq({})
      expect(c.skip_parse).to eq(false)
      expect(c.skip_classify).to eq(false)
      expect(c.skip_extract).to eq(false)
      expect(c.model).to be_nil
    end

    it "accepts custom values" do
      c = described_class::Config.new(
        model: "gpt-4o",
        skip_parse: true,
        categories: [{ name: "test" }]
      )
      expect(c.model).to eq("gpt-4o")
      expect(c.skip_parse).to eq(true)
      expect(c.categories.size).to eq(1)
    end
  end
end
