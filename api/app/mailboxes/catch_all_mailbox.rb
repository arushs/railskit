# frozen_string_literal: true

# Catch-all mailbox — receives any inbound email that doesn't match
# a more specific route. Logs and bounces by default.
#
# Customize this for your app's needs, or replace with specific mailboxes.
class CatchAllMailbox < ApplicationMailbox
  def process
    Rails.logger.info(
      "[Inbound Email] Unrouted email from #{mail.from&.first} " \
      "to #{mail.to&.join(', ')} — subject: #{mail.subject}"
    )

    # Bounce unrecognized inbound emails so senders know it didn't land.
    # Remove this line if you want to silently discard instead.
    bounce_with UserMailer.with(email: mail.from&.first).welcome(
      OpenStruct.new(email: mail.from&.first)
    ) if respond_to?(:bounce_with)
  end
end
