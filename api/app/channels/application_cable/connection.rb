# frozen_string_literal: true

module ApplicationCable
  class Connection < ActionCable::Connection::Base
    identified_by :current_user

    def connect
      self.current_user = find_verified_user
    end

    private

    def find_verified_user
      # Extract JWT from query params (WebSocket can't send cookies reliably cross-origin)
      token = request.params[:token]
      if token.present?
        user = authenticate_jwt(token)
        return user if user
      end

      # Fallback: try cookie-based JWT
      token_from_cookie = cookies.signed[:jwt]
      if token_from_cookie.present?
        user = authenticate_jwt(token_from_cookie)
        return user if user
      end

      reject_unauthorized_connection
    end

    def authenticate_jwt(token)
      secret = ENV.fetch("DEVISE_JWT_SECRET_KEY", Rails.application.credentials.devise_jwt_secret_key)
      payload = JWT.decode(token, secret, true, algorithm: "HS256").first
      User.find_by(id: payload["sub"])
    rescue JWT::DecodeError, JWT::ExpiredSignature
      nil
    end
  end
end
