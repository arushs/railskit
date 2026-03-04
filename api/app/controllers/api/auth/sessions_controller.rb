# frozen_string_literal: true

module Api
  module Auth
    class SessionsController < Devise::SessionsController
      respond_to :json

      private

      def respond_with(resource, _opts = {})
        token = request.env["warden-jwt_auth.token"]
        set_jwt_cookie(token) if token

        render json: {
          user: user_json(resource),
          token: token
        }, status: :ok
      end

      def respond_to_on_destroy
        clear_jwt_cookie
        render json: { message: "Signed out" }, status: :ok
      end

      def set_jwt_cookie(token)
        cookies[:jwt] = {
          value: token,
          httponly: true,
          secure: Rails.env.production?,
          same_site: Rails.env.production? ? :none : :lax,
          expires: 24.hours.from_now,
          path: "/"
        }
      end

      def clear_jwt_cookie
        cookies.delete(:jwt, path: "/")
      end

      def user_json(user)
        {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar_url: user.avatar_url,
          plan: user.plan,
          created_at: user.created_at
        }
      end
    end
  end
end
