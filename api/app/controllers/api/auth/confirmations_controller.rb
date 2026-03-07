# frozen_string_literal: true

module Api
  module Auth
    class ConfirmationsController < Devise::ConfirmationsController
      respond_to :json

      # POST /api/auth/confirmation — resend confirmation email
      def create
        self.resource = resource_class.send_confirmation_instructions(resource_params)
        if successfully_sent?(resource)
          render json: { message: "Confirmation email sent" }, status: :ok
        else
          render json: { errors: resource.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # GET /api/auth/confirmation?confirmation_token=xxx
      def show
        self.resource = resource_class.confirm_by_token(params[:confirmation_token])
        if resource.errors.empty?
          render json: { message: "Email confirmed successfully" }, status: :ok
        else
          render json: { errors: resource.errors.full_messages }, status: :unprocessable_entity
        end
      end
    end
  end
end
