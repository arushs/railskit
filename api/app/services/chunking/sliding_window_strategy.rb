# frozen_string_literal: true

module Chunking
  class SlidingWindowStrategy < BaseStrategy
    def chunk(text, size: 512, overlap: 50)
      return [text] if estimate_tokens(text) <= size

      chars_per_chunk = size * 4
      overlap_chars = overlap * 4
      step = [chars_per_chunk - overlap_chars, 1].max

      chunks = []
      pos = 0

      while pos < text.length
        chunk_text = text[pos, chars_per_chunk]
        if pos + chars_per_chunk < text.length
          last_space = chunk_text.rindex(/\s/)
          chunk_text = chunk_text[0..last_space] if last_space && last_space > chars_per_chunk * 0.5
        end
        chunk_text = chunk_text.strip
        chunks << chunk_text unless chunk_text.blank?
        pos += step
      end

      chunks
    end
  end
end
