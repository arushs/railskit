# frozen_string_literal: true

module Api
  module Auth
    class MeController < ApplicationController
      before_action :authenticate_user_from_jwt!

      # GET /api/auth/me — get current user profile
      def show
        render json: {
          user: {
            id: current_user.id,
            email: current_user.email,
            name: current_user.name,
            avatar_url: current_user.avatar_url,
            plan: current_user.plan,
            created_at: current_user.created_at
          }
        }
      end

      # PATCH /api/auth/me — update profile
      def update
        if current_user.update(profile_params)
          render json: {
            user: {
              id: current_user.id,
              email: current_user.email,
              name: current_user.name,
              avatar_url: current_user.avatar_url,
              plan: current_user.plan,
              created_at: current_user.created_at
            }
          }
        else
          render_unprocessable(current_user)
        end
      end

      private

      def profile_params
        params.require(:user).permit(:name, :avatar_url)
      end
    end
  end
end
