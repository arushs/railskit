# frozen_string_literal: true

module Api
  module Auth
    class TwoFactorController < ApplicationController
      include JwtCookie
      before_action :authenticate_user!, except: [:challenge]

      # POST /api/auth/two_factor/enable
      # Generates a new OTP secret and returns provisioning URI for QR code
      def enable
        if current_user.two_factor_enabled?
          render json: { error: "Two-factor authentication is already enabled" }, status: :unprocessable_entity
          return
        end

        current_user.enable_two_factor!
        render json: {
          otp_uri: current_user.two_factor_qr_uri,
          message: "Scan the QR code with your authenticator app, then verify with a code"
        }, status: :ok
      end

      # POST /api/auth/two_factor/verify
      # Confirms 2FA setup with a valid OTP code
      def verify
        otp_code = params[:otp_code]

        unless current_user.otp_secret.present?
          render json: { error: "Two-factor setup not initiated. Call enable first." }, status: :unprocessable_entity
          return
        end

        backup_codes = current_user.confirm_two_factor!(otp_code)
        if backup_codes
          render json: {
            message: "Two-factor authentication enabled successfully",
            backup_codes: backup_codes
          }, status: :ok
        else
          render json: { error: "Invalid OTP code" }, status: :unprocessable_entity
        end
      end

      # POST /api/auth/two_factor/disable
      # Disables 2FA with password confirmation
      def disable
        unless current_user.valid_password?(params[:password])
          render json: { error: "Invalid password" }, status: :unauthorized
          return
        end

        current_user.disable_two_factor!
        render json: { message: "Two-factor authentication disabled" }, status: :ok
      end

      # POST /api/auth/two_factor/backup_codes
      # Regenerates backup codes (requires password)
      def backup_codes
        unless current_user.valid_password?(params[:password])
          render json: { error: "Invalid password" }, status: :unauthorized
          return
        end

        codes = current_user.generate_otp_backup_codes!
        render json: {
          backup_codes: codes,
          message: "New backup codes generated. Store them safely — old codes are invalidated."
        }, status: :ok
      end

      # POST /api/auth/two_factor/challenge
      # Validates OTP during login flow and issues real JWT
      def challenge
        temp_token = params[:temp_token]
        otp_code = params[:otp_code]

        user = User.from_two_factor_temp_token(temp_token)
        unless user
          render json: { error: "Invalid or expired token" }, status: :unauthorized
          return
        end

        # Try OTP code first, then backup code
        valid = user.validate_and_consume_otp!(otp_code) || user.consume_otp_backup_code!(otp_code)

        unless valid
          render json: { error: "Invalid OTP code" }, status: :unauthorized
          return
        end

        # Issue real JWT
        sign_in(user)
        token = encode_jwt_for(user)
        set_jwt_cookie(token)

        render json: {
          user: user_json(user),
          token: token
        }, status: :ok
      end
    end
  end
end
