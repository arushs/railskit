# frozen_string_literal: true

module Chunking
  class BaseStrategy
    def self.chunk(text, size: 512, overlap: 50)
      new.chunk(text, size: size, overlap: overlap)
    end

    def chunk(_text, size: 512, overlap: 50)
      raise NotImplementedError
    end

    private

    def estimate_tokens(text)
      (text.length / 4.0).ceil
    end
  end
end
