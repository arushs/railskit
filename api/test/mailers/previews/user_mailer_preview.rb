# frozen_string_literal: true

# Preview all emails at http://localhost:3000/rails/mailers/user_mailer
class UserMailerPreview < ActionMailer::Preview
  def welcome
    UserMailer.welcome(mock_user)
  end

  def magic_link
    UserMailer.magic_link(mock_user, token: "abc123-preview-token", expires_in: 15.minutes)
  end

  def password_reset
    UserMailer.password_reset(mock_user, token: "reset-preview-token")
  end

  private

  def mock_user
    # Use a real User if the model exists, otherwise a struct.
    if defined?(User) && User.respond_to?(:first)
      User.first || OpenStruct.new(email: "jane@example.com", name: "Jane Doe")
    else
      OpenStruct.new(email: "jane@example.com", name: "Jane Doe")
    end
  end
end
