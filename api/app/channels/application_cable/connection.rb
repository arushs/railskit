# frozen_string_literal: true

module ApplicationCable
  class Connection < ActionCable::Connection::Base
    identified_by :current_user_id

    def connect
      self.current_user_id = find_verified_user_id
    end

    private

    def find_verified_user_id
      token = request.params["token"] || extract_token_from_cookie
      return reject_unauthorized_connection unless token

      payload = decode_jwt(token)
      payload&.fetch("user_id", nil) || reject_unauthorized_connection
    rescue StandardError
      reject_unauthorized_connection
    end

    def extract_token_from_cookie
      cookies.signed[:jwt] || cookies[:jwt]
    end

    def decode_jwt(token)
      secret = Rails.application.secret_key_base
      decoded = JWT.decode(token, secret, true, algorithm: "HS256")
      decoded.first
    rescue JWT::DecodeError, JWT::ExpiredSignature
      nil
    end
  end
end
