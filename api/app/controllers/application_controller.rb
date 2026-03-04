# frozen_string_literal: true

class ApplicationController < ActionController::API
  include ActionController::Cookies
  respond_to :json

  before_action :set_jwt_from_cookie

  private

  # Transparently forward the httpOnly JWT cookie as an Authorization header
  # so that Devise-JWT middleware can authenticate the request.
  def set_jwt_from_cookie
    return if request.headers["Authorization"].present?
    return unless cookies[:jwt].present?

    request.headers["Authorization"] = "Bearer #{cookies[:jwt]}"
  end

  def authenticate_user_from_jwt!
    token = cookies[:jwt] || extract_token_from_header
    return render_unauthorized unless token

    begin
      payload = JWT.decode(token, devise_jwt_secret, true, algorithm: "HS256").first
      @current_user = User.find(payload["sub"])
    rescue JWT::DecodeError, ActiveRecord::RecordNotFound
      render_unauthorized
    end
  end

  def current_user
    @current_user || warden&.user(:user)
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

  def warden
    request.env["warden"]
  end
end
