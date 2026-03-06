# frozen_string_literal: true

module Chunking
  class ParagraphStrategy < BaseStrategy
    def chunk(text, size: 512, overlap: 50)
      paragraphs = text.split(/\n{2,}/).map(&:strip).reject(&:blank?)
      merge_to_size(paragraphs, size: size, overlap: overlap)
    end

    private

    def merge_to_size(paragraphs, size:, overlap:)
      chunks = []
      current = []
      current_tokens = 0

      paragraphs.each do |para|
        para_tokens = estimate_tokens(para)
        if current_tokens + para_tokens > size && current.any?
          chunks << current.join("\n\n")
          overlap_text = build_overlap(current, overlap)
          current = overlap_text ? [overlap_text] : []
          current_tokens = current.sum { |c| estimate_tokens(c) }
        end
        current << para
        current_tokens += para_tokens
      end

      chunks << current.join("\n\n") if current.any?
      chunks
    end

    def build_overlap(parts, overlap)
      return nil if overlap <= 0
      text = parts.join("\n\n")
      overlap_chars = overlap * 4
      tail = text[-(overlap_chars)..]
      tail&.strip.presence
    end
  end
end
