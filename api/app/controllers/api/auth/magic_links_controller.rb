# frozen_string_literal: true

module Api
  module Auth
    class MagicLinksController < ApplicationController
      include JwtCookie

      # POST /api/auth/magic_link — request a magic link
      def create
        user = User.find_by(email: params[:email])

        if user
          token = user.generate_magic_link_token!
          MagicLinkMailer.login_link(user, token).deliver_later
        end

        # Always return success to prevent email enumeration
        render json: { message: "If that email exists, a magic link has been sent." }, status: :ok
      end

      # POST /api/auth/magic_link/verify — verify and sign in
      def verify
        user = User.find_by(magic_link_token: params[:token])

        if user&.magic_link_valid?
          user.consume_magic_link!
          sign_in(user)
          token = encode_jwt_for(user)
          set_jwt_cookie(token)

          render json: {
            user: user_json(user),
            token: token
          }, status: :ok
        else
          render json: { error: "Invalid or expired magic link" }, status: :unauthorized
        end
      end
    end
  end
end
