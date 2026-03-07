# frozen_string_literal: true

require "rails_helper"

RSpec.describe UserMailer, type: :mailer do
  let(:user) { OpenStruct.new(email: "user@example.com", name: "Test User") }

  before do
    allow(RailsKit).to receive(:config).and_return(
      OpenStruct.new(
        app: OpenStruct.new(name: "TestApp", domain: "test.com"),
        email: OpenStruct.new(provider: "resend", from: "TestApp <noreply@test.com>"),
        theme: OpenStruct.new(primary_color: "#6366f1", dark_mode: true)
      )
    )
  end

  describe "#welcome" do
    subject(:mail) { described_class.welcome(user) }

    it "sends to the user's email" do
      expect(mail.to).to eq(["user@example.com"])
    end

    it "includes the app name in the subject" do
      expect(mail.subject).to include("TestApp")
      expect(mail.subject).to include("Welcome")
    end

    it "renders both HTML and text parts" do
      expect(mail.body.parts.map(&:content_type)).to include(
        a_string_matching(/text\/html/),
        a_string_matching(/text\/plain/)
      )
    end
  end

  describe "#magic_link" do
    subject(:mail) { described_class.magic_link(user, token: "abc123") }

    it "sends to the user's email" do
      expect(mail.to).to eq(["user@example.com"])
    end

    it "has a sign-in subject" do
      expect(mail.subject).to include("sign-in link")
    end
  end

  describe "#password_reset" do
    subject(:mail) { described_class.password_reset(user, token: "reset123") }

    it "sends to the user's email" do
      expect(mail.to).to eq(["user@example.com"])
    end

    it "has a password reset subject" do
      expect(mail.subject).to include("Reset your password")
    end
  end
end
