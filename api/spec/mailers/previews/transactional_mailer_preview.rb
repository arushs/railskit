# frozen_string_literal: true

# Preview at http://localhost:3000/rails/mailers/transactional_mailer
class TransactionalMailerPreview < ActionMailer::Preview
  def subscription_confirmation
    user = User.first || OpenStruct.new(email: "preview@example.com", name: "Preview User")
    subscription = OpenStruct.new(
      plan_name: "Pro",
      amount: 29_00,
      currency: "usd",
      interval: "month"
    )
    TransactionalMailer.subscription_confirmation(user, subscription: subscription)
  end

  def invoice_receipt
    user = User.first || OpenStruct.new(email: "preview@example.com", name: "Preview User")
    invoice = OpenStruct.new(
      amount: 29_00,
      currency: "usd",
      description: "Pro plan - March 2026",
      receipt_url: "https://pay.stripe.com/receipts/preview"
    )
    TransactionalMailer.invoice_receipt(user, invoice: invoice)
  end
end
