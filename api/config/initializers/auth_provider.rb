# frozen_string_literal: true

# Pluggable auth provider configuration.
# Set AUTH_PROVIDER env var to switch strategies:
#   - "devise_jwt" (default) — Devise + JWT + Google OAuth + Magic Links
#   - "supabase"             — Supabase Auth (stub)
#   - "clerk"                — Clerk (stub)
#
# Each provider implements the same interface so controllers stay clean.

module RailsKit
  module Auth
    PROVIDER = ENV.fetch("AUTH_PROVIDER", "devise_jwt").freeze

    def self.provider
      PROVIDER
    end

    def self.devise_jwt?
      PROVIDER == "devise_jwt"
    end

    def self.supabase?
      PROVIDER == "supabase"
    end

    def self.clerk?
      PROVIDER == "clerk"
    end
  end
end
