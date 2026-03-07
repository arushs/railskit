# frozen_string_literal: true

module Api
  module Auth
    class RegistrationsController < Devise::RegistrationsController
      include JwtCookie
      respond_to :json

      private

      def respond_with(resource, _opts = {})
        if resource.persisted?
          if resource.confirmed? || !resource.confirmation_required?
            token = request.env["warden-jwt_auth.token"]
            set_jwt_cookie(token) if token

            render json: {
              user: user_json(resource),
              token: token
            }, status: :created
          else
            render json: {
              user: user_json(resource),
              message: "A confirmation email has been sent to #{resource.email}",
              confirmation_required: true
            }, status: :created
          end
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
    end
  end
end
