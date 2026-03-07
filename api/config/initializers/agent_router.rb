# frozen_string_literal: true

# Register agents with the router for capability-based routing.
# Add your custom agents here after generating them.
#
# Priority breaks ties — higher priority agents are preferred when
# multiple agents match equally well.

Rails.application.config.after_initialize do
  AgentRouter.register(HelpDeskAgent,
    capabilities: %w[support tickets faq help knowledge general],
    priority: 0)

  AgentRouter.register(BillingAgent,
    capabilities: %w[billing payments invoices refunds subscription pricing],
    priority: 1)

  AgentRouter.register(DocumentParserAgent,
    capabilities: %w[parse extract_text pdf image ocr sections pages],
    priority: 2)

  AgentRouter.register(DocumentClassifierAgent,
    capabilities: %w[classify categorize document_type identification],
    priority: 2)

  AgentRouter.register(DocumentExtractorAgent,
    capabilities: %w[extract fields data structured invoice contract],
    priority: 2)
end
