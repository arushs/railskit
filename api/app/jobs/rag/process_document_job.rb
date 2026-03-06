# frozen_string_literal: true

module Rag
  class ProcessDocumentJob < ApplicationJob
    queue_as :default

    retry_on StandardError, wait: :polynomially_longer, attempts: 3

    def perform(document_id)
      document = Document.find_by(id: document_id)
      return unless document
      return unless document.status.in?(%w[pending error])

      document.process!
    end
  end
end
