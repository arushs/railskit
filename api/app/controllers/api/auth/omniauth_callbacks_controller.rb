# frozen_string_literal: true

module Api
  module Auth
    class OmniauthCallbacksController < Devise::OmniauthCallbacksController
      include JwtCookie

      def google_oauth2
        user = User.from_omniauth(request.env["omniauth.auth"])

        if user.persisted?
          sign_in(user)
          token = encode_jwt_for(user)
          set_jwt_cookie(token)

          # Redirect to frontend with success
          redirect_to "#{frontend_url}/auth/callback?success=true", allow_other_host: true
        else
          redirect_to "#{frontend_url}/auth/callback?error=oauth_failed", allow_other_host: true
        end
      end

      def failure
        redirect_to "#{frontend_url}/auth/callback?error=#{failure_message}", allow_other_host: true
      end

      private

      def frontend_url
        ENV.fetch("FRONTEND_URL", "http://localhost:5173")
      end
    end
  end
end
