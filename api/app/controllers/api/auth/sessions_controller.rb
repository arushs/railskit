# frozen_string_literal: true

module Api
  module Auth
    class SessionsController < Devise::SessionsController
      include JwtCookie
      respond_to :json

      # Override create to handle 2FA challenge flow
      def create
        user = User.find_for_database_authentication(email: sign_in_params[:email])

        if user.nil? || !user.valid_password?(sign_in_params[:password])
          render json: { error: "Invalid email or password" }, status: :unauthorized
          return
        end

        if user.access_locked?
          render json: { error: "Your account is locked. Check your email for unlock instructions." }, status: :unauthorized
          return
        end

        # Reset failed attempts on successful password
        user.update!(failed_attempts: 0) if user.failed_attempts > 0

        # If 2FA is required, return temp token for challenge
        if user.otp_required_for_login?
          temp_token = user.generate_two_factor_temp_token!
          render json: {
            requires_2fa: true,
            temp_token: temp_token
          }, status: :ok
          return
        end

        # Standard login — sign in and issue JWT
        sign_in(user)
        token = encode_jwt_for(user)
        set_jwt_cookie(token)

        render json: {
          user: user_json(user),
          token: token
        }, status: :ok
      end

      def destroy
        clear_jwt_cookie
        sign_out(current_user) if current_user
        render json: { message: "Signed out" }, status: :ok
      end

      private

      def sign_in_params
        params.require(:user).permit(:email, :password)
      end
    end
  end
end
