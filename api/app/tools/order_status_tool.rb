# frozen_string_literal: true

class OrderStatusTool < RubyLLM::Tool
  description "Check the status of a customer order or subscription."
  param :order_id, type: :string, desc: "The order ID (e.g. ORD-5678)"
  param :email, type: :string, desc: "Customer email address"

  def execute(order_id: nil, email: nil)
    return { error: "Provide order_id or email." } unless order_id || email
    # Replace with: Order.find_by(id: order_id)
    { order_id: order_id || "ORD-5678", email: email || "customer@example.com",
      plan: "Pro", status: "active", current_period_end: "2026-04-01",
      amount: "$29/month", payment_method: "Visa ending in 4242" }
  end
end
