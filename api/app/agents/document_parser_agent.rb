# frozen_string_literal: true

class DocumentParserAgent
  include RubyLLM::Agent
  include StructuredOutput
  include AsTool

  tool_name "document_parser"
  tool_description "Parses documents (PDF, images, or raw text) and extracts structured text by page/section."
  tool_param :file_path, type: :string, desc: "Path to a PDF or image file to parse", required: false
  tool_param :raw_text, type: :string, desc: "Raw text content to parse directly", required: false

  SYSTEM_PROMPT = <<~PROMPT
    You are a document parsing assistant. Your job is to analyze document text and
    identify logical sections within each page. Return structured data with page breaks
    and section headings preserved.
  PROMPT

  attr_reader :llm_chat

  def initialize(model: nil, **_opts)
    @model = model
    @llm_chat = RubyLLM.chat(model: model)
    @llm_chat.with_instructions(SYSTEM_PROMPT)
  end

  def parse(file_path: nil, raw_text: nil)
    raise ArgumentError, "Provide either file_path or raw_text" if file_path.nil? && raw_text.nil?

    if raw_text
      parse_text(raw_text)
    elsif pdf?(file_path)
      parse_pdf(file_path)
    elsif image?(file_path)
      parse_image(file_path)
    else
      parse_text(File.read(file_path))
    end
  end

  # AsTool interface
  def ask(message)
    parse(raw_text: message)
  end

  private

  def pdf?(path)
    File.extname(path).downcase == ".pdf"
  end

  def image?(path)
    %w[.png .jpg .jpeg .gif .webp .tiff .bmp].include?(File.extname(path).downcase)
  end

  def parse_pdf(file_path)
    reader = PDF::Reader.new(file_path)
    pages = reader.pages.map.with_index(1) do |page, idx|
      text = page.text.to_s
      {
        page_number: idx,
        text: text,
        sections: extract_sections(text)
      }
    end

    full_text = pages.map { |p| p[:text] }.join("\n\n")

    {
      pages: pages,
      full_text: full_text,
      page_count: pages.size
    }
  end

  def parse_image(file_path)
    # Use RubyLLM vision capability to extract text from images
    response = @llm_chat.ask(
      "Extract all text from this image. Preserve formatting, headings, and structure as much as possible.",
      with: { image: file_path }
    )

    text = response.respond_to?(:content) ? response.content : response.to_s

    {
      pages: [{ page_number: 1, text: text, sections: extract_sections(text) }],
      full_text: text,
      page_count: 1
    }
  end

  def parse_text(text)
    sections = extract_sections(text)

    {
      pages: [{ page_number: 1, text: text, sections: sections }],
      full_text: text,
      page_count: 1
    }
  end

  def extract_sections(text)
    return [] if text.blank?

    sections = []
    current_heading = nil
    current_lines = []

    text.each_line do |line|
      stripped = line.strip
      if section_heading?(stripped)
        if current_heading || current_lines.any?
          sections << {
            heading: current_heading,
            content: current_lines.join("\n").strip
          }
        end
        current_heading = stripped
        current_lines = []
      else
        current_lines << line
      end
    end

    # Flush remaining
    if current_heading || current_lines.any?
      sections << {
        heading: current_heading,
        content: current_lines.join("\n").strip
      }
    end

    sections
  end

  def section_heading?(line)
    return false if line.blank?
    return true if line.match?(/\A[A-Z][A-Z\s\d:.\-]{2,}\z/)       # ALL CAPS headings
    return true if line.match?(/\A#{1,6}\s/)                         # Markdown headings
    return true if line.match?(/\A\d+\.\s+[A-Z]/)                   # Numbered sections like "1. Introduction"

    false
  end
end
