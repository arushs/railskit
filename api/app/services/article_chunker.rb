# Heading-aware chunking service for articles.
#
# Splits article body into ~800 token chunks with 15% overlap.
# Respects heading boundaries so chunks start at natural section breaks.
#
# Usage:
#   ArticleChunker.new(article).chunk!
#   ArticleChunker.new(article, target_tokens: 600, overlap_ratio: 0.2).chunk!
#
class ArticleChunker
  # Rough approximation: 1 token ≈ 4 characters for English text
  CHARS_PER_TOKEN = 4

  DEFAULT_TARGET_TOKENS = 800
  DEFAULT_OVERLAP_RATIO = 0.15

  # Headings we split on (Markdown-style)
  HEADING_PATTERN = /^(\#{1,6})\s+/

  attr_reader :article, :target_tokens, :overlap_ratio

  def initialize(article, target_tokens: DEFAULT_TARGET_TOKENS, overlap_ratio: DEFAULT_OVERLAP_RATIO)
    @article = article
    @target_tokens = target_tokens
    @overlap_ratio = overlap_ratio
  end

  # Splits the article body into chunks and persists them as ArticleChunk records.
  # Returns the created chunks.
  def chunk!
    chunks = build_chunks
    records = chunks.each_with_index.map do |text, index|
      article.article_chunks.create!(
        chunk_text: text,
        chunk_index: index
      )
    end
    records
  end

  # Returns an array of chunk text strings without persisting.
  def build_chunks
    return [] if article.body.blank?

    sections = split_by_headings(article.body)
    merge_sections_into_chunks(sections)
  end

  private

  def target_chars
    @target_chars ||= target_tokens * CHARS_PER_TOKEN
  end

  def overlap_chars
    @overlap_chars ||= (target_chars * overlap_ratio).to_i
  end

  # Split body into sections by headings. Each section includes its heading.
  # Returns array of strings.
  def split_by_headings(text)
    lines = text.lines
    sections = []
    current_section = []

    lines.each do |line|
      if line.match?(HEADING_PATTERN) && current_section.any?
        sections << current_section.join
        current_section = [line]
      else
        current_section << line
      end
    end

    sections << current_section.join if current_section.any?
    sections.reject(&:blank?)
  end

  # Merge small sections together and split large ones to hit target size.
  def merge_sections_into_chunks(sections)
    chunks = []
    current_chunk = +""

    sections.each do |section|
      if section.length > target_chars
        # Flush current buffer first
        unless current_chunk.empty?
          chunks << current_chunk.strip
          current_chunk = +""
        end
        # Split oversized section into sub-chunks
        chunks.concat(split_large_section(section))
      elsif current_chunk.length + section.length > target_chars
        # Current chunk is full enough — flush and start new
        chunks << current_chunk.strip
        current_chunk = +""
        current_chunk << section
      else
        current_chunk << section
      end
    end

    chunks << current_chunk.strip unless current_chunk.strip.empty?

    apply_overlap(chunks)
  end

  # Split a single large section into target-sized pieces at sentence boundaries.
  def split_large_section(section)
    sentences = section.scan(/[^.!?]+[.!?]+\s*|[^.!?\n]+\n+|[^.!?\n]+\z/).reject(&:blank?)
    chunks = []
    current = +""

    sentences.each do |sentence|
      if current.length + sentence.length > target_chars && !current.empty?
        chunks << current.strip
        current = +""
      end
      current << sentence
    end

    chunks << current.strip unless current.strip.empty?
    chunks
  end

  # Apply overlap: prepend the tail of the previous chunk to the start of the next.
  def apply_overlap(chunks)
    return chunks if chunks.length <= 1

    overlapped = [chunks.first]

    (1...chunks.length).each do |i|
      prev_chunk = chunks[i - 1]
      overlap_text = extract_overlap_from_end(prev_chunk)
      overlapped << "#{overlap_text}#{chunks[i]}"
    end

    overlapped
  end

  # Extract approximately overlap_chars worth of text from the end of a chunk,
  # breaking at a sentence or word boundary.
  def extract_overlap_from_end(text)
    return "" if text.length <= overlap_chars

    tail = text[-(overlap_chars)..]

    # Try to break at a sentence boundary
    sentence_break = tail.index(/(?<=[.!?])\s+/)
    if sentence_break
      return tail[(sentence_break + 1)..]
    end

    # Fall back to word boundary
    word_break = tail.index(/\s+/)
    if word_break
      return tail[(word_break + 1)..]
    end

    tail
  end
end
