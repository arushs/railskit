# frozen_string_literal: true

# Shared JWT httpOnly cookie helpers.
# Include in any controller that issues or clears JWT tokens.
module JwtCookie
  extend ActiveSupport::Concern

  private

  def set_jwt_cookie(token)
    cookies[:jwt] = {
      value: token,
      httponly: true,
      secure: Rails.env.production?,
      same_site: Rails.env.production? ? :none : :lax,
      expires: 24.hours.from_now,
      path: "/"
    }
  end

  def clear_jwt_cookie
    cookies.delete(:jwt, path: "/")
  end

  def encode_jwt_for(user)
    Warden::JWTAuth::UserEncoder.new.call(user, :user, nil).first
  end

  def user_json(user)
    {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar_url: user.avatar_url,
      plan: user.plan,
      created_at: user.created_at
    }
  end
end
