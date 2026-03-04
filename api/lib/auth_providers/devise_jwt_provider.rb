# frozen_string_literal: true

module AuthProviders
  class DeviseJwtProvider < Base
    # The default provider. All logic lives in Devise controllers and
    # ApplicationController's authenticate_user_from_jwt! method.
    # This class exists for interface parity with stubs.

    def authenticate_request(request)
      token = extract_token(request)
      return nil unless token

      payload = JWT.decode(token, jwt_secret, true, algorithm: "HS256").first
      User.find(payload["sub"])
    rescue JWT::DecodeError, ActiveRecord::RecordNotFound
      nil
    end

    def current_user(request)
      authenticate_request(request)
    end

    private

    def extract_token(request)
      request.cookies["jwt"] ||
        request.headers["Authorization"]&.match(/^Bearer (.+)$/)&.captures&.first
    end

    def jwt_secret
      ENV.fetch("DEVISE_JWT_SECRET_KEY") {
        Rails.application.credentials.devise_jwt_secret_key || Rails.application.secret_key_base
      }
    end
  end
end
