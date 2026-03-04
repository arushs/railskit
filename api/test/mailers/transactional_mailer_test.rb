# frozen_string_literal: true

require "test_helper"

class TransactionalMailerTest < ActionMailer::TestCase
  setup do
    @user = OpenStruct.new(email: "test@example.com", name: "Test User")
  end

  test "subscription_confirmation email" do
    subscription = OpenStruct.new(
      plan_name: "Pro",
      current_period_end: Date.new(2026, 4, 1)
    )

    email = TransactionalMailer.subscription_confirmation(@user, subscription: subscription)

    assert_emails 1 do
      email.deliver_now
    end

    assert_equal ["test@example.com"], email.to
    assert_match "Subscription confirmed", email.subject
    assert_match "Pro", email.body.encoded
  end

  test "invoice_receipt email" do
    invoice = {
      number: "INV-001",
      date: Date.new(2026, 3, 1),
      amount: "$29.00",
      description: "Pro plan",
      receipt_url: "https://example.com/receipt"
    }

    email = TransactionalMailer.invoice_receipt(@user, invoice: invoice)

    assert_emails 1 do
      email.deliver_now
    end

    assert_equal ["test@example.com"], email.to
    assert_match "Receipt", email.subject
    assert_match "INV-001", email.body.encoded
    assert_match "$29.00", email.body.encoded
  end
end
