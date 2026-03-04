# frozen_string_literal: true

module Api
  module Auth
    class SessionsController < Devise::SessionsController
      include JwtCookie
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
    end
  end
end
