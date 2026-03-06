# frozen_string_literal: true

module Rag
  # QueryExpander uses an LLM to improve search queries before retrieval.
  #
  # Three strategies:
  #   - :lexical — Generate synonyms and related terms for keyword search
  #   - :vector  — Rephrase query for better embedding similarity
  #   - :hyde    — Generate a hypothetical answer document (HyDE)
  #
  # Usage:
  #   expanded = Rag::QueryExpander.expand("How do I reset my password?", strategy: :hyde)
  #   expanded.text        # => "To reset your password, navigate to Settings > Security..."
  #   expanded.strategy    # => :hyde
  #   expanded.original    # => "How do I reset my password?"
  #
  class QueryExpander
    Result = Data.define(:text, :strategy, :original)

    STRATEGIES = %i[lexical vector hyde].freeze

    PROMPTS = {
      lexical: <<~PROMPT,
        Given the search query below, generate an expanded version with synonyms and related terms.
        Output ONLY the expanded query — no explanations, no quotes, no preamble.

        Query: %{query}
      PROMPT

      vector: <<~PROMPT,
        Rephrase the following search query to maximize semantic similarity with relevant documents.
        Make it more specific and descriptive. Output ONLY the rephrased query — no explanations.

        Query: %{query}
      PROMPT

      hyde: <<~PROMPT
        Write a short, factual paragraph that would be the ideal answer to the following question.
        This will be used for document retrieval, so be specific and information-dense.
        Output ONLY the paragraph — no preamble, no "Here is..." prefix.

        Question: %{query}
      PROMPT
    }.freeze

    class << self
      # Expand a query using the specified strategy
      # @param query [String] original search query
      # @param strategy [Symbol] :lexical, :vector, or :hyde
      # @return [Result]
      def expand(query, strategy: :hyde)
        raise ArgumentError, "Unknown strategy: #{strategy}. Use: #{STRATEGIES.join(', ')}" unless STRATEGIES.include?(strategy)
        return Result.new(text: query, strategy: strategy, original: query) if query.blank?

        prompt = PROMPTS[strategy] % { query: query }
        expanded_text = call_llm(prompt)

        Result.new(
          text: expanded_text.strip,
          strategy: strategy,
          original: query
        )
      rescue ArgumentError
        raise # re-raise argument errors
      rescue => e
        # Fallback: return original query on LLM failure
        Rails.logger.warn("[QueryExpander] LLM call failed (#{e.class}: #{e.message}), falling back to original query")
        Result.new(text: query, strategy: strategy, original: query)
      end

      # Expand for multiple strategies and return all variants
      # Useful for multi-query retrieval
      # @param query [String]
      # @param strategies [Array<Symbol>]
      # @return [Array<Result>]
      def expand_multi(query, strategies: [:vector, :hyde])
        strategies.map { |s| expand(query, strategy: s) }
      end

      private

      def call_llm(prompt)
        chat = RubyLLM.chat(model: llm_model)
        response = chat.ask(prompt)
        response.content
      end

      def llm_model
        config = RailsKit.config
        rag_model = config.respond_to?(:rag) && config.rag.respond_to?(:expansion_model) ? config.rag.expansion_model : nil
        ai_model = config.respond_to?(:ai) && config.ai.respond_to?(:model) ? config.ai.model : nil
        rag_model || ai_model || "gpt-4o-mini"
      rescue
        "gpt-4o-mini"
      end
    end
  end
end
