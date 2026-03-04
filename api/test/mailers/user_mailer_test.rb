# frozen_string_literal: true

require "test_helper"

class UserMailerTest < ActionMailer::TestCase
  setup do
    @user = OpenStruct.new(email: "test@example.com", name: "Test User")
  end

  test "welcome email" do
    email = UserMailer.welcome(@user)

    assert_emails 1 do
      email.deliver_now
    end

    assert_equal ["test@example.com"], email.to
    assert_match "Welcome", email.subject
    assert_match "Test User", email.body.encoded
  end

  test "magic_link email" do
    email = UserMailer.magic_link(@user, token: "abc123", expires_in: 15.minutes)

    assert_emails 1 do
      email.deliver_now
    end

    assert_equal ["test@example.com"], email.to
    assert_match "sign-in link", email.subject
    assert_match "abc123", email.body.encoded
    assert_match "15 minutes", email.body.encoded
  end

  test "password_reset email" do
    email = UserMailer.password_reset(@user, token: "reset-token-xyz")

    assert_emails 1 do
      email.deliver_now
    end

    assert_equal ["test@example.com"], email.to
    assert_match "Reset your password", email.subject
    assert_match "reset-token-xyz", email.body.encoded
  end
end
