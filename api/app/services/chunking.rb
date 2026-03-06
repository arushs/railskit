# frozen_string_literal: true

module Chunking
  STRATEGIES = {
    "paragraph" => "Chunking::ParagraphStrategy",
    "page" => "Chunking::PageStrategy",
    "semantic" => "Chunking::SemanticStrategy",
    "sliding_window" => "Chunking::SlidingWindowStrategy",
    "markdown" => "Chunking::MarkdownStrategy"
  }.freeze

  def self.strategy(name)
    klass = STRATEGIES[name.to_s]
    raise ArgumentError, "Unknown chunking strategy: #{name}" unless klass
    klass.constantize.new
  end

  def self.available_strategies
    STRATEGIES.keys
  end
end

# Alias for convenience
module RailsKit
  Chunking = ::Chunking
end
