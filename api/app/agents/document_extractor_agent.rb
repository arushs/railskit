# frozen_string_literal: true

class DocumentExtractorAgent
  include RubyLLM::Agent
  include StructuredOutput
  include AsTool

  tool_name "document_extractor"
  tool_description "Extracts structured fields from document text based on a provided schema."
  tool_param :text, type: :string, desc: "The document text to extract from", required: true
  tool_param :schema, type: :string, desc: "JSON array of field definitions [{field_name, type, description, required}]", required: true

  SYSTEM_PROMPT = <<~PROMPT
    You are a document field extraction specialist. Given document text and a schema
    of fields to extract, find and return each field's value along with your confidence
    and the source text where you found it.

    Always respond with valid JSON only, no markdown fencing.
  PROMPT

  attr_reader :llm_chat

  def initialize(model: nil, **_opts)
    @model = model
    @llm_chat = RubyLLM.chat(model: model)
    @llm_chat.with_instructions(SYSTEM_PROMPT)
  end

  def extract(text:, schema:)
    raise ArgumentError, "text is required" if text.blank?
    raise ArgumentError, "schema is required" if schema.blank?

    schema_desc = schema.map do |field|
      req = field[:required] ? " (REQUIRED)" : " (optional)"
      "- #{field[:field_name]} (#{field[:type]}): #{field[:description]}#{req}"
    end.join("\n")

    prompt = <<~MSG
      Extract the following fields from this document:

      #{schema_desc}

      Document text:
      ---
      #{text.truncate(8000)}
      ---

      For each field, respond with JSON:
      {
        "fields": {
          "field_name": {
            "value": <extracted value or null>,
            "confidence": 0.0-1.0,
            "source_text": "the text snippet where you found this"
          }
        }
      }
    MSG

    response = @llm_chat.ask(prompt)
    content = response.respond_to?(:content) ? response.content : response.to_s

    parse_extraction(content, schema)
  end

  # AsTool interface
  def ask(message)
    extract(text: message, schema: default_schema)
  end

  private

  def parse_extraction(content, schema)
    json = JSON.parse(content, symbolize_names: true)
    fields = json[:fields] || {}

    # Ensure all schema fields are present in the result
    result = {}
    schema.each do |field|
      field_name = field[:field_name].to_sym
      if fields[field_name]
        result[field_name] = {
          value: fields[field_name][:value],
          confidence: [[fields[field_name][:confidence].to_f, 0.0].max, 1.0].min,
          source_text: fields[field_name][:source_text].to_s
        }
      else
        result[field_name] = { value: nil, confidence: 0.0, source_text: "" }
      end
    end

    { fields: result }
  rescue JSON::ParserError
    # Return empty fields on parse failure
    result = {}
    schema.each do |field|
      result[field[:field_name].to_sym] = { value: nil, confidence: 0.0, source_text: "" }
    end
    { fields: result }
  end

  def default_schema
    [
      { field_name: "title", type: "string", description: "Document title", required: false }
    ]
  end
end
