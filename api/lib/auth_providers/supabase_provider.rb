# frozen_string_literal: true

module AuthProviders
  # Stub for Supabase Auth integration.
  #
  # To implement:
  # 1. Set AUTH_PROVIDER=supabase
  # 2. Set SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_JWT_SECRET
  # 3. Verify Supabase JWT tokens in authenticate_request
  # 4. User records are synced from Supabase auth.users via webhooks or on first auth
  #
  # Supabase handles: sign up, sign in, OAuth, magic links, password reset
  # Rails handles: user profile data, authorization, business logic
  class SupabaseProvider < Base
    def authenticate_request(request)
      raise NotImplementedError, <<~MSG
        Supabase Auth provider is not yet implemented.
        Set AUTH_PROVIDER=devise_jwt to use the default provider.

        To implement:
        - Verify Supabase JWT from Authorization header
        - Look up/create local User from Supabase user ID
        - See: https://supabase.com/docs/guides/auth/jwts
      MSG
    end

    def current_user(request)
      authenticate_request(request)
    end
  end
end
