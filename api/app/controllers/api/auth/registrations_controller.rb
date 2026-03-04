# frozen_string_literal: true

module Api
  module Auth
    class RegistrationsController < Devise::RegistrationsController
      respond_to :json

      private

      def respond_with(resource, _opts = {})
        if resource.persisted?
          token = request.env["warden-jwt_auth.token"]
          set_jwt_cookie(token) if token

          render json: {
            user: user_json(resource),
            token: token
          }, status: :created
        else
          render json: {
            error: "Sign up failed",
            details: resource.errors.full_messages
          }, status: :unprocessable_entity
        end
      end

      def sign_up_params
        params.require(:user).permit(:email, :password, :password_confirmation, :name)
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
