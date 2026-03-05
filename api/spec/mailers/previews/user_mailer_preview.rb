# frozen_string_literal: true

# Preview at http://localhost:3000/rails/mailers/user_mailer
class UserMailerPreview < ActionMailer::Preview
  def welcome
    user = User.first || OpenStruct.new(email: "preview@example.com", name: "Preview User")
    UserMailer.welcome(user)
  end

  def magic_link
    user = User.first || OpenStruct.new(email: "preview@example.com", name: "Preview User")
    UserMailer.magic_link(user, token: "preview-token-abc123")
  end

  def password_reset
    user = User.first || OpenStruct.new(email: "preview@example.com", name: "Preview User")
    UserMailer.password_reset(user, token: "preview-reset-token")
  end
end
