# frozen_string_literal: true

class ExtractionSchema < RubyLLM::Schema
  field :name, type: :string, desc: "Person's full name"
  field :email, type: :string, desc: "Email address if mentioned"
  field :company, type: :string, desc: "Company or organization name"
  field :order_id, type: :string, desc: "Order or ticket ID if mentioned"
  field :intent, type: :string, desc: "Primary intent: inquiry, complaint, request, feedback"
end
