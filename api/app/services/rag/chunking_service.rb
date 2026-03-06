# frozen_string_literal: true

module Rag
  # ChunkingService splits text into overlapping chunks suitable for embedding.
  #
  # Supports multiple strategies:
  #   - :recursive (default) — split by paragraphs, then sentences, then characters
  #   - :sentence — split on sentence boundaries
  #   - :fixed — fixed-size character windows
  #
  # Usage:
  #   chunks = Rag::ChunkingService.chunk(text, strategy: :recursive, chunk_size: 512)
  #   # => [{ content: "...", start_offset: 0, end_offset: 512, token_count: 128 }, ...]
  #
  class ChunkingService
    DEFAULT_CHUNK_SIZE = 512    # tokens
    DEFAULT_OVERLAP = 64        # tokens
    CHARS_PER_TOKEN = 4         # rough approximation

    class << self
      def chunk(text, strategy: :recursive, chunk_size: nil, overlap: nil, metadata: {})
        chunk_size ||= config_chunk_size
        overlap ||= config_overlap

        chunks = case strategy
                 when :recursive then recursive_chunk(text, chunk_size, overlap)
                 when :sentence then sentence_chunk(text, chunk_size, overlap)
                 when :fixed then fixed_chunk(text, chunk_size, overlap)
                 else raise ArgumentError, "Unknown chunking strategy: #{strategy}"
                 end

        chunks.map { |c| c.merge(metadata: metadata) }
      end

      private

      def recursive_chunk(text, max_tokens, overlap_tokens)
        max_chars = max_tokens * CHARS_PER_TOKEN
        overlap_chars = overlap_tokens * CHARS_PER_TOKEN

        # First: split by double newlines (paragraphs)
        paragraphs = text.split(/\n{2,}/).map(&:strip).reject(&:empty?)

        chunks = []
        current_chunk = +""
        current_start = 0
        char_offset = 0

        paragraphs.each do |para|
          # Find this paragraph's offset in original text
          para_start = text.index(para, char_offset) || char_offset

          if current_chunk.empty?
            current_chunk = para
            current_start = para_start
          elsif (current_chunk.length + para.length + 2) <= max_chars
            current_chunk << "\n\n" << para
          else
            # Emit current chunk
            chunks << build_chunk(current_chunk, current_start)

            # Start new chunk with overlap
            if overlap_chars > 0 && current_chunk.length > overlap_chars
              overlap_text = current_chunk[-(overlap_chars)..]
              # Find a clean break point (sentence or word boundary)
              break_point = overlap_text.index(/[.!?]\s/) || overlap_text.index(/\s/) || 0
              overlap_text = overlap_text[(break_point + 1)..].to_s.strip
              current_chunk = overlap_text.empty? ? para : "#{overlap_text}\n\n#{para}"
              current_start = para_start - overlap_text.length
            else
              current_chunk = para
              current_start = para_start
            end
          end

          char_offset = para_start + para.length
        end

        # Emit final chunk
        chunks << build_chunk(current_chunk, current_start) unless current_chunk.empty?

        # If any chunk is still too large, split by sentences
        chunks.flat_map do |chunk|
          if estimate_tokens(chunk[:content]) > max_tokens * 1.5
            sentence_chunk(chunk[:content], max_tokens, overlap_tokens).map do |sub|
              sub.merge(start_offset: chunk[:start_offset] + (sub[:start_offset] || 0))
            end
          else
            [chunk]
          end
        end
      end

      def sentence_chunk(text, max_tokens, overlap_tokens)
        max_chars = max_tokens * CHARS_PER_TOKEN
        overlap_chars = overlap_tokens * CHARS_PER_TOKEN

        sentences = text.scan(/[^.!?]+[.!?]+\s*|\S[^.!?]*$/).map(&:strip).reject(&:empty?)

        chunks = []
        current_chunk = +""
        current_start = 0
        char_offset = 0

        sentences.each do |sentence|
          sent_start = text.index(sentence, char_offset) || char_offset

          if current_chunk.empty?
            current_chunk = sentence
            current_start = sent_start
          elsif (current_chunk.length + sentence.length + 1) <= max_chars
            current_chunk << " " << sentence
          else
            chunks << build_chunk(current_chunk, current_start)

            if overlap_chars > 0 && current_chunk.length > overlap_chars
              overlap_text = current_chunk[-(overlap_chars)..].to_s.strip
              current_chunk = "#{overlap_text} #{sentence}"
              current_start = sent_start - overlap_text.length
            else
              current_chunk = sentence
              current_start = sent_start
            end
          end

          char_offset = sent_start + sentence.length
        end

        chunks << build_chunk(current_chunk, current_start) unless current_chunk.empty?
        chunks
      end

      def fixed_chunk(text, max_tokens, overlap_tokens)
        max_chars = max_tokens * CHARS_PER_TOKEN
        overlap_chars = overlap_tokens * CHARS_PER_TOKEN
        step = max_chars - overlap_chars

        chunks = []
        offset = 0

        while offset < text.length
          chunk_text = text[offset, max_chars].to_s.strip
          break if chunk_text.empty?

          chunks << build_chunk(chunk_text, offset)
          offset += step
        end

        chunks
      end

      def build_chunk(content, start_offset)
        {
          content: content.strip,
          start_offset: start_offset,
          end_offset: start_offset + content.length,
          token_count: estimate_tokens(content)
        }
      end

      def estimate_tokens(text)
        (text.length.to_f / CHARS_PER_TOKEN).ceil
      end

      def config_chunk_size
        Rails.application.config.railskit.dig(:rag, :chunk_size) || DEFAULT_CHUNK_SIZE
      rescue
        DEFAULT_CHUNK_SIZE
      end

      def config_overlap
        Rails.application.config.railskit.dig(:rag, :overlap) || DEFAULT_OVERLAP
      rescue
        DEFAULT_OVERLAP
      end
    end
  end
end
