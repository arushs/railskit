# frozen_string_literal: true

# ActionMailbox routing — processes inbound emails.
#
# Route inbound emails to specific mailboxes based on recipient address patterns.
# See: https://guides.rubyonrails.org/action_mailbox_basics.html
#
# Examples:
#   routing /support@/i  => :support
#   routing /reply\+(.+)@/i => :reply
#
# The catch-all sends unmatched emails to the default mailbox.
class ApplicationMailbox < ActionMailbox::Base
  # Route support@ emails
  # routing /support@/i => :support

  # Route reply+ tagged addresses (e.g., reply+ticket-123@yourapp.com)
  # routing /reply\+/i => :reply

  # Catch-all — log and discard unrouted inbound emails
  routing :all => :catch_all
end
