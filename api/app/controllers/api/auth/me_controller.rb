# frozen_string_literal: true

module Api
  module Auth
    class MeController < ApplicationController
      before_action :authenticate_user_from_jwt!

      # GET /api/auth/me — get current user profile
      def show
        render json: { user: user_json(current_user) }
      end

      # PATCH /api/auth/me — update profile
      def update
        if current_user.update(profile_params)
          render json: { user: user_json(current_user) }
        else
          render_unprocessable(current_user)
        end
      end

      private

      def profile_params
        params.require(:user).permit(:name, :avatar_url)
      end

      def user_json(user)
        {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar_url: user.avatar_url,
          plan: user.plan,
          admin: user.respond_to?(:admin) ? user.admin : false,
          created_at: user.created_at,
        }
      end
    end
  end
end
