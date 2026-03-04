# frozen_string_literal: true

module AuthProviders
  # Stub for Clerk Auth integration.
  #
  # To implement:
  # 1. Set AUTH_PROVIDER=clerk
  # 2. Set CLERK_SECRET_KEY, CLERK_PUBLISHABLE_KEY
  # 3. Verify Clerk session tokens in authenticate_request
  # 4. Sync user records from Clerk via webhooks or on first auth
  #
  # Clerk handles: sign up, sign in, OAuth, magic links, MFA, session management
  # Rails handles: user profile extensions, authorization, business logic
  class ClerkProvider < Base
    def authenticate_request(request)
      raise NotImplementedError, <<~MSG
        Clerk Auth provider is not yet implemented.
        Set AUTH_PROVIDER=devise_jwt to use the default provider.

        To implement:
        - Verify Clerk session JWT from __session cookie or Authorization header
        - Look up/create local User from Clerk user ID
        - See: https://clerk.com/docs/backend-requests/handling/manual-jwt
      MSG
    end

    def current_user(request)
      authenticate_request(request)
    end
  end
end
