# frozen_string_literal: true

class UserMailer < ApplicationMailer
  # Welcome email — sent after registration.
  def welcome(user)
    @user     = user
    @app_name = RailsKit.config.app.name
    @login_url = root_url

    mail(
      to: @user.email,
      subject: branded_subject("Welcome to #{@app_name}!")
    )
  end

  # Magic link sign-in — improved version with expiry info.
  def magic_link(user, token:, expires_in: 15.minutes)
    @user       = user
    @app_name   = RailsKit.config.app.name
    @magic_url  = magic_link_url(token: token)
    @expires_in = expires_in

    mail(
      to: @user.email,
      subject: branded_subject("Your sign-in link")
    )
  end

  # Password reset instructions.
  def password_reset(user, token:)
    @user      = user
    @app_name  = RailsKit.config.app.name
    @reset_url = password_reset_url(token: token)

    mail(
      to: @user.email,
      subject: branded_subject("Reset your password")
    )
  end
end
