# frozen_string_literal: true

module Chunking
  class SemanticStrategy < BaseStrategy
    SENTENCE_BOUNDARY = /(?<=[.!?])\s+(?=[A-Z])/

    def chunk(text, size: 512, overlap: 50)
      sentences = text.split(SENTENCE_BOUNDARY).map(&:strip).reject(&:blank?)
      return [text] if sentences.size <= 1
      merge_sentences(sentences, size: size, overlap: overlap)
    end

    private

    def merge_sentences(sentences, size:, overlap:)
      chunks = []
      current = []
      current_tokens = 0

      sentences.each do |sentence|
        s_tokens = estimate_tokens(sentence)
        if current_tokens + s_tokens > size && current.any?
          chunks << current.join(" ")
          current = overlap_sentences(current, overlap)
          current_tokens = current.sum { |s| estimate_tokens(s) }
        end
        current << sentence
        current_tokens += s_tokens
      end

      chunks << current.join(" ") if current.any?
      chunks
    end

    def overlap_sentences(sentences, overlap)
      return [] if overlap <= 0
      result = []
      tokens = 0
      sentences.reverse_each do |s|
        tokens += estimate_tokens(s)
        break if tokens > overlap
        result.unshift(s)
      end
      result
    end
  end
end
