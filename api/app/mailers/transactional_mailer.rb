# frozen_string_literal: true

class TransactionalMailer < ApplicationMailer
  # Subscription confirmed — sent after successful payment.
  def subscription_confirmation(user, subscription:)
    @user         = user
    @subscription = subscription
    @app_name     = RailsKit.config.app.name
    @manage_url   = billing_portal_url

    mail(
      to: @user.email,
      subject: branded_subject("Subscription confirmed")
    )
  end

  # Invoice receipt — sent after each successful charge.
  def invoice_receipt(user, invoice:)
    @user     = user
    @invoice  = invoice
    @app_name = RailsKit.config.app.name

    mail(
      to: @user.email,
      subject: branded_subject("Receipt for your payment")
    )
  end
end
