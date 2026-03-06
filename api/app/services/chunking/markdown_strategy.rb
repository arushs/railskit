# frozen_string_literal: true

module Chunking
  class MarkdownStrategy < BaseStrategy
    HEADER_PATTERN = /^\#{1,6}\s+/

    def chunk(text, size: 512, overlap: 50)
      sections = split_by_headers(text)
      return [text] if sections.size <= 1

      result = []
      sections.each do |section|
        if estimate_tokens(section) <= size
          result << section
        else
          result.concat(ParagraphStrategy.new.chunk(section, size: size, overlap: overlap))
        end
      end
      result
    end

    private

    def split_by_headers(text)
      lines = text.lines
      sections = []
      current = []

      lines.each do |line|
        if line.match?(HEADER_PATTERN) && current.any?
          sections << current.join.strip
          current = [line]
        else
          current << line
        end
      end

      sections << current.join.strip if current.any?
      sections.reject(&:blank?)
    end
  end
end
