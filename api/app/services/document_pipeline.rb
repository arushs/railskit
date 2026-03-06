# frozen_string_literal: true

# DocumentPipeline orchestrates the parse → classify → extract workflow.
#
# Usage:
#   config = DocumentPipeline::Config.new(
#     categories: [
#       { name: "invoice", description: "An invoice or bill", examples: ["Invoice #123"] },
#       { name: "contract", description: "A legal contract", examples: ["Agreement between..."] }
#     ],
#     extraction_schemas: {
#       "invoice" => [
#         { field_name: "invoice_number", type: "string", description: "The invoice number", required: true },
#         { field_name: "total_amount", type: "number", description: "Total amount due", required: true }
#       ],
#       "contract" => [
#         { field_name: "parties", type: "string", description: "Names of the contracting parties", required: true },
#         { field_name: "effective_date", type: "date", description: "When the contract takes effect", required: true }
#       ]
#     }
#   )
#
#   result = DocumentPipeline.new(config).process(file_path: "doc.pdf")
#   result[:parsed][:full_text]
#   result[:classification][:classification]  # => "invoice"
#   result[:extracted][:fields][:invoice_number][:value]
#
class DocumentPipeline
  Config = Struct.new(:categories, :extraction_schemas, :model, :skip_parse, :skip_classify, :skip_extract, keyword_init: true) do
    def initialize(**)
      super
      self.categories ||= []
      self.extraction_schemas ||= {}
      self.skip_parse ||= false
      self.skip_classify ||= false
      self.skip_extract ||= false
    end
  end

  attr_reader :config

  def initialize(config)
    @config = config
  end

  def process(file_path: nil, raw_text: nil)
    result = { parsed: nil, classification: nil, extracted: nil }

    # Step 1: Parse
    if config.skip_parse && raw_text
      result[:parsed] = { pages: [], full_text: raw_text, page_count: 0 }
    else
      parser = DocumentParserAgent.new(model: config.model)
      result[:parsed] = parser.parse(file_path: file_path, raw_text: raw_text)
    end

    text = result[:parsed][:full_text]

    # Step 2: Classify
    unless config.skip_classify
      if config.categories.any?
        classifier = DocumentClassifierAgent.new(model: config.model)
        result[:classification] = classifier.classify(text: text, categories: config.categories)
      else
        result[:classification] = { classification: "unknown", confidence: 0.0, reasoning: "No categories configured" }
      end
    end

    # Step 3: Extract
    unless config.skip_extract
      category = result.dig(:classification, :classification) || "default"
      schema = config.extraction_schemas[category] || config.extraction_schemas["default"] || []

      if schema.any?
        extractor = DocumentExtractorAgent.new(model: config.model)
        result[:extracted] = extractor.extract(text: text, schema: schema)
      else
        result[:extracted] = { fields: {} }
      end
    end

    result
  end
end
