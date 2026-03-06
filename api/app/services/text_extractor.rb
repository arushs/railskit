# frozen_string_literal: true

class TextExtractor
  class UnsupportedFormatError < StandardError; end

  EXTRACTORS = {
    "application/pdf" => :extract_pdf,
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document" => :extract_docx,
    "text/plain" => :extract_plain,
    "text/markdown" => :extract_plain,
    "text/html" => :extract_html
  }.freeze

  EXTENSION_MAP = {
    ".pdf" => "application/pdf",
    ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".txt" => "text/plain",
    ".md" => "text/markdown",
    ".html" => "text/html",
    ".htm" => "text/html"
  }.freeze

  def self.extract(document)
    new(document).extract
  end

  def self.supported?(content_type_or_ext)
    return EXTRACTORS.key?(content_type_or_ext) if content_type_or_ext.include?("/")
    EXTENSION_MAP.key?(content_type_or_ext.downcase)
  end

  def initialize(document)
    @document = document
  end

  def extract
    content_type = detect_content_type
    method_name = EXTRACTORS[content_type]
    raise UnsupportedFormatError, "Unsupported format: #{content_type}" unless method_name
    send(method_name)
  end

  private

  def detect_content_type
    return @document.content_type if @document.content_type.present? && EXTRACTORS.key?(@document.content_type)
    ext = File.extname(@document.name).downcase
    EXTENSION_MAP[ext] || @document.content_type || raise(UnsupportedFormatError, "Cannot detect format for: #{@document.name}")
  end

  def file_content
    if @document.file.attached?
      @document.file.download
    else
      raise "No file attached to document ##{@document.id}"
    end
  end

  def extract_pdf
    require "pdf-reader"
    io = StringIO.new(file_content)
    reader = PDF::Reader.new(io)
    reader.pages.map(&:text).join("\n\n")
  end

  def extract_docx
    require "docx"
    io = StringIO.new(file_content)
    doc = Docx::Document.open(io)
    doc.paragraphs.map(&:text).reject(&:blank?).join("\n\n")
  end

  def extract_plain
    file_content.force_encoding("UTF-8")
  end

  def extract_html
    require "nokogiri"
    html = file_content.force_encoding("UTF-8")
    doc = Nokogiri::HTML(html)
    doc.css("script, style, nav, footer, header").remove
    doc.text.gsub(/\n{3,}/, "\n\n").strip
  end
end
