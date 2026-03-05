# frozen_string_literal: true

require "rails_helper"

RSpec.describe TransactionalMailer, type: :mailer do
  let(:user) { OpenStruct.new(email: "user@example.com", name: "Test User") }

  before do
    allow(RailsKit).to receive(:config).and_return(
      OpenStruct.new(
        app: OpenStruct.new(name: "TestApp", domain: "test.com"),
        email: OpenStruct.new(provider: "resend", from: "TestApp <noreply@test.com>")
      )
    )
  end

  describe "#subscription_confirmation" do
    let(:subscription) do
      OpenStruct.new(
        plan_name: "Pro",
        amount: 29_00,
        currency: "usd",
        interval: "month"
      )
    end

    subject(:mail) { described_class.subscription_confirmation(user, subscription: subscription) }

    it "sends to the user's email" do
      expect(mail.to).to eq(["user@example.com"])
    end

    it "has a confirmation subject" do
      expect(mail.subject).to include("Subscription confirmed")
    end
  end

  describe "#invoice_receipt" do
    let(:invoice) do
      OpenStruct.new(
        amount: 29_00,
        currency: "usd",
        description: "Pro plan - March 2026",
        receipt_url: "https://pay.stripe.com/receipts/xxx"
      )
    end

    subject(:mail) { described_class.invoice_receipt(user, invoice: invoice) }

    it "sends to the user's email" do
      expect(mail.to).to eq(["user@example.com"])
    end

    it "has a receipt subject" do
      expect(mail.subject).to include("Receipt for your payment")
    end
  end
end
