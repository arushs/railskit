# frozen_string_literal: true

class TicketLookupTool < RubyLLM::Tool
  description "Look up a support ticket by its ID to get status, subject, and details."
  param :ticket_id, type: :string, desc: "The ticket ID (e.g. TKT-1234)", required: true

  def execute(ticket_id:)
    # Replace with: SupportTicket.find_by!(ticket_number: ticket_id)
    { ticket_id: ticket_id, subject: "Cannot access billing page", status: "open",
      priority: "high", assigned_to: "Support Team",
      last_update: "Escalated to engineering — investigating payment gateway timeout." }
  end
end
