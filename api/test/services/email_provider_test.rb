# frozen_string_literal: true

require "test_helper"

class EmailProviderTest < ActiveSupport::TestCase
  test "resolves resend adapter" do
    adapter = EmailProvider::ResendAdapter.new
    assert_equal "Resend", adapter.provider_name
  end

  test "resend adapter returns smtp delivery config" do
    ENV["RESEND_API_KEY"] = "re_test_123"
    adapter = EmailProvider::ResendAdapter.new
    config  = adapter.delivery_config

    assert_equal :smtp, config[:method]
    assert_equal "smtp.resend.com", config[:settings][:address]
    assert_equal 465, config[:settings][:port]
    assert_equal "re_test_123", config[:settings][:password]
  ensure
    ENV.delete("RESEND_API_KEY")
  end

  test "resend adapter raises without api key" do
    ENV.delete("RESEND_API_KEY")
    adapter = EmailProvider::ResendAdapter.new

    assert_raises(EmailProvider::DeliveryError) do
      adapter.delivery_config
    end
  end

  test "resolves postmark adapter" do
    adapter = EmailProvider::PostmarkAdapter.new
    assert_equal "Postmark", adapter.provider_name
  end

  test "postmark adapter returns smtp config" do
    ENV["POSTMARK_API_TOKEN"] = "pm_test_456"
    adapter = EmailProvider::PostmarkAdapter.new
    config  = adapter.delivery_config

    assert_equal :smtp, config[:method]
    assert_equal "smtp.postmarkapp.com", config[:settings][:address]
    assert_equal 587, config[:settings][:port]
  ensure
    ENV.delete("POSTMARK_API_TOKEN")
  end

  test "resolves smtp adapter" do
    ENV["SMTP_ADDRESS"] = "mail.example.com"
    adapter = EmailProvider::SmtpAdapter.new
    config  = adapter.delivery_config

    assert_equal :smtp, config[:method]
    assert_equal "mail.example.com", config[:settings][:address]
  ensure
    ENV.delete("SMTP_ADDRESS")
  end

  test "raises for unknown provider" do
    assert_raises(ArgumentError) do
      EmailProvider.send(:resolve, "carrier_pigeon")
    end
  end
end
