# frozen_string_literal: true

# Preview all emails at http://localhost:3000/rails/mailers/transactional_mailer
class TransactionalMailerPreview < ActionMailer::Preview
  def subscription_confirmation
    TransactionalMailer.subscription_confirmation(
      mock_user,
      subscription: OpenStruct.new(
        plan_name: "Pro",
        current_period_end: 30.days.from_now
      )
    )
  end

  def invoice_receipt
    TransactionalMailer.invoice_receipt(
      mock_user,
      invoice: {
        number: "INV-2026-0042",
        date: Date.current,
        amount: "$29.00",
        description: "Pro plan — monthly",
        receipt_url: "https://pay.stripe.com/receipts/example"
      }
    )
  end

  private

  def mock_user
    if defined?(User) && User.respond_to?(:first)
      User.first || OpenStruct.new(email: "jane@example.com", name: "Jane Doe")
    else
      OpenStruct.new(email: "jane@example.com", name: "Jane Doe")
    end
  end
end
