# frozen_string_literal: true

module Api
  module Auth
    class UnlocksController < Devise::UnlocksController
      respond_to :json

      # POST /api/auth/unlock — request unlock email
      def create
        self.resource = resource_class.send_unlock_instructions(resource_params)
        if successfully_sent?(resource)
          render json: { message: "Unlock instructions sent" }, status: :ok
        else
          render json: { errors: resource.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # GET /api/auth/unlock?unlock_token=xxx
      def show
        self.resource = resource_class.unlock_access_by_token(params[:unlock_token])
        if resource.errors.empty?
          render json: { message: "Account unlocked successfully" }, status: :ok
        else
          render json: { errors: resource.errors.full_messages }, status: :unprocessable_entity
        end
      end
    end
  end
end
