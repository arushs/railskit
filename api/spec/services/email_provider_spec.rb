# frozen_string_literal: true

require "rails_helper"

RSpec.describe EmailProvider do
  let(:email_config) { OpenStruct.new(provider: "resend", from: "Test <noreply@test.com>") }

  before do
    allow(RailsKit).to receive(:config).and_return(
      OpenStruct.new(email: email_config, app: OpenStruct.new(name: "TestApp", domain: "test.com"))
    )
    EmailProvider.reload!
  end

  after { EmailProvider.reload! }

  describe ".adapter" do
    context "with resend provider" do
      it "returns a ResendAdapter" do
        expect(described_class.adapter).to be_a(EmailProvider::ResendAdapter)
      end
    end

    context "with postmark provider" do
      let(:email_config) { OpenStruct.new(provider: "postmark", from: "Test <noreply@test.com>") }

      it "returns a PostmarkAdapter" do
        expect(described_class.adapter).to be_a(EmailProvider::PostmarkAdapter)
      end
    end

    context "with smtp provider" do
      let(:email_config) { OpenStruct.new(provider: "smtp", from: "Test <noreply@test.com>") }

      it "returns an SmtpAdapter" do
        expect(described_class.adapter).to be_a(EmailProvider::SmtpAdapter)
      end
    end

    context "with unknown provider" do
      let(:email_config) { OpenStruct.new(provider: "sendgrid", from: "Test <noreply@test.com>") }

      it "raises ArgumentError" do
        expect { described_class.adapter }.to raise_error(ArgumentError, /Unknown email provider: sendgrid/)
      end
    end
  end

  describe EmailProvider::ResendAdapter do
    subject(:adapter) { described_class.new }

    it "returns delivery config with SMTP method" do
      allow(ENV).to receive(:fetch).with("RESEND_API_KEY").and_return("re_test123")

      config = adapter.delivery_config
      expect(config[:method]).to eq(:smtp)
      expect(config[:settings][:address]).to eq("smtp.resend.com")
      expect(config[:settings][:port]).to eq(465)
      expect(config[:settings][:password]).to eq("re_test123")
      expect(config[:settings][:ssl]).to be true
    end

    it "raises DeliveryError when API key missing" do
      allow(ENV).to receive(:fetch).with("RESEND_API_KEY").and_call_original
      # Ensure the env var is not set
      expect { adapter.send(:api_key) }.to raise_error(EmailProvider::DeliveryError, /RESEND_API_KEY is required/)
    end

    it "has the correct provider name" do
      expect(adapter.provider_name).to eq("Resend")
    end
  end

  describe EmailProvider::PostmarkAdapter do
    subject(:adapter) { described_class.new }

    it "returns delivery config with SMTP method" do
      allow(ENV).to receive(:fetch).with("POSTMARK_API_TOKEN").and_return("pm_test123")

      config = adapter.delivery_config
      expect(config[:method]).to eq(:smtp)
      expect(config[:settings][:address]).to eq("smtp.postmarkapp.com")
      expect(config[:settings][:port]).to eq(587)
    end

    it "has the correct provider name" do
      expect(adapter.provider_name).to eq("Postmark")
    end
  end

  describe EmailProvider::SmtpAdapter do
    subject(:adapter) { described_class.new }

    it "reads SMTP config from ENV" do
      allow(ENV).to receive(:fetch).with("SMTP_ADDRESS", "localhost").and_return("mail.example.com")
      allow(ENV).to receive(:fetch).with("SMTP_PORT", 587).and_return("465")
      allow(ENV).to receive(:fetch).with("SMTP_DOMAIN", anything).and_return("example.com")

      config = adapter.delivery_config
      expect(config[:method]).to eq(:smtp)
      expect(config[:settings][:address]).to eq("mail.example.com")
    end

    it "has the correct provider name" do
      allow(ENV).to receive(:fetch).with("SMTP_ADDRESS", "localhost").and_return("mail.example.com")
      expect(adapter.provider_name).to eq("SMTP (mail.example.com)")
    end
  end
end
