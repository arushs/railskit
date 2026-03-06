# frozen_string_literal: true

module Chunking
  class PageStrategy < BaseStrategy
    PAGE_BREAK = /\f|\n-{3,}\n/

    def chunk(text, size: 512, overlap: 50)
      pages = text.split(PAGE_BREAK).map(&:strip).reject(&:blank?)
      return SlidingWindowStrategy.new.chunk(text, size: size, overlap: overlap) if pages.size <= 1

      result = []
      pages.each do |page|
        if estimate_tokens(page) <= size
          result << page
        else
          result.concat(ParagraphStrategy.new.chunk(page, size: size, overlap: overlap))
        end
      end
      result
    end
  end
end
