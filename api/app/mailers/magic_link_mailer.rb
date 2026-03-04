# frozen_string_literal: true

class MagicLinkMailer < ApplicationMailer
  def login_link(user, token)
    @user = user
    @token = token
    @url = "#{ENV.fetch('FRONTEND_URL', 'http://localhost:5173')}/auth/magic-link/verify?token=#{token}"

    mail(to: @user.email, subject: "Your magic login link")
  end
end
