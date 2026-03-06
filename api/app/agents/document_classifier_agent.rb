# frozen_string_literal: true

class DocumentClassifierAgent
  include RubyLLM::Agent
  include StructuredOutput
  include AsTool

  tool_name "document_classifier"
  tool_description "Classifies document text into one of the provided categories."
  tool_param :text, type: :string, desc: "The document text to classify", required: true
  tool_param :categories, type: :string, desc: "JSON array of category definitions [{name, description, examples}]", required: true

  SYSTEM_PROMPT = <<~PROMPT
    You are a document classification specialist. Given document text and a set of
    categories, determine which category best fits the document. Return your answer
    as JSON with keys: classification (category name), confidence (0.0-1.0), and
    reasoning (brief explanation).

    Always respond with valid JSON only, no markdown fencing.
  PROMPT

  attr_reader :llm_chat

  def initialize(model: nil, **_opts)
    @model = model
    @llm_chat = RubyLLM.chat(model: model)
    @llm_chat.with_instructions(SYSTEM_PROMPT)
  end

  def classify(text:, categories:)
    raise ArgumentError, "text is required" if text.blank?
    raise ArgumentError, "categories are required" if categories.blank?

    categories_desc = categories.map do |cat|
      parts = ["- #{cat[:name]}: #{cat[:description]}"]
      if cat[:examples]&.any?
        parts << "  Examples: #{cat[:examples].join(', ')}"
      end
      parts.join("\n")
    end.join("\n")

    prompt = <<~MSG
      Classify the following document into one of these categories:

      #{categories_desc}

      Document text:
      ---
      #{text.truncate(8000)}
      ---

      Respond with JSON: {"classification": "category_name", "confidence": 0.0-1.0, "reasoning": "..."}
    MSG

    response = @llm_chat.ask(prompt)
    content = response.respond_to?(:content) ? response.content : response.to_s

    parse_classification(content, categories)
  end

  # AsTool interface
  def ask(message)
    classify(text: message, categories: default_categories)
  end

  private

  def parse_classification(content, categories)
    json = JSON.parse(content, symbolize_names: true)
    valid_names = categories.map { |c| c[:name] }

    {
      classification: valid_names.include?(json[:classification]) ? json[:classification] : valid_names.first,
      confidence: [[json[:confidence].to_f, 0.0].max, 1.0].min,
      reasoning: json[:reasoning].to_s
    }
  rescue JSON::ParserError
    # Fallback: try to extract from unstructured response
    {
      classification: categories.first&.dig(:name) || "unknown",
      confidence: 0.0,
      reasoning: "Failed to parse LLM response: #{content.truncate(200)}"
    }
  end

  def default_categories
    [
      { name: "general", description: "General document", examples: [] }
    ]
  end
end
