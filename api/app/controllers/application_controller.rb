# frozen_string_literal: true

class ApplicationController < ActionController::API
  respond_to :json

  private

  def authenticate_user_from_jwt!
    token = extract_token_from_cookie || extract_token_from_header
    return render_unauthorized unless token

    begin
      payload = JWT.decode(token, devise_jwt_secret, true, algorithm: "HS256").first
      @current_user = User.find(payload["sub"])
    rescue JWT::DecodeError, ActiveRecord::RecordNotFound
      render_unauthorized
    end
  end

  def current_user
    @current_user || super
  end

  def extract_token_from_cookie
    cookies[:jwt]
  end

  def extract_token_from_header
    header = request.headers["Authorization"]
    header&.match(/^Bearer (.+)$/)&.captures&.first
  end

  def devise_jwt_secret
    ENV.fetch("DEVISE_JWT_SECRET_KEY") { Rails.application.credentials.devise_jwt_secret_key || Rails.application.secret_key_base }
  end

  def render_unauthorized
    render json: { error: "Unauthorized" }, status: :unauthorized
  end

  def render_unprocessable(resource)
    render json: {
      error: "Validation failed",
      details: resource.errors.full_messages
    }, status: :unprocessable_entity
  end
end
