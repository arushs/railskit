# frozen_string_literal: true

class KnowledgeSearchTool < RubyLLM::Tool
  description "Search the knowledge base for help articles matching a query."
  param :query, type: :string, desc: "Search query", required: true
  param :limit, type: :integer, desc: "Max results (default: 3)"

  def execute(query:, limit: 3)
    # Replace with: Article.search(query).limit(limit)
    { query: query, results: [
      { title: "How to Reset Your Password", url: "/help/reset-password",
        excerpt: "Go to Settings > Security > Reset Password." },
      { title: "Billing FAQ", url: "/help/billing-faq",
        excerpt: "Invoices are generated on the 1st of each month." },
      { title: "Getting Started Guide", url: "/help/getting-started",
        excerpt: "This guide walks you through setup." }
    ].first(limit) }
  end
end
