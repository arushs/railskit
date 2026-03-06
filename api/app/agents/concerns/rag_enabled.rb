# frozen_string_literal: true

module RailsKit
  module RAGEnabled
    extend ActiveSupport::Concern

    included do
      class_attribute :_rag_collections, default: []
      class_attribute :_rag_auto_inject, default: false
      class_attribute :_rag_top_k, default: 3
    end

    class_methods do
      def rag_collections(*names)
        self._rag_collections = names.map(&:to_s)
      end

      def rag_auto_inject(value = true)
        self._rag_auto_inject = value
      end

      def rag_top_k(value)
        self._rag_top_k = value
      end
    end

    def ask(message)
      if self.class._rag_auto_inject
        context = retrieve_context(message)
        augmented = build_augmented_message(message, context)
        super(augmented)
      else
        super(message)
      end
    end

    def search_knowledge(query, limit: nil)
      limit ||= self.class._rag_top_k
      service = EmbeddingService.new
      collections = resolve_collections
      if collections.any?
        collections.flat_map { |c| service.search(query, collection: c, limit: limit) }
                   .sort_by { |r| -r[:score] }.first(limit)
      else
        service.search(query, limit: limit)
      end
    end

    private

    def retrieve_context(query)
      search_knowledge(query)
    end

    def build_augmented_message(message, context)
      return message if context.empty?
      context_text = context.map do |r|
        "[Source: #{r[:document].name} (relevance: #{r[:score].round(3)})]\n#{r[:content]}"
      end.join("\n\n---\n\n")

      "Context from knowledge base:\n#{context_text}\n\n---\n\nUser question: #{message}"
    end

    def resolve_collections
      return [] if self.class._rag_collections.empty?
      self.class._rag_collections.filter_map { |name| DocumentCollection.find_by(name: name) }
    end
  end
end
