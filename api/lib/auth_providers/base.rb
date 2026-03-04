# frozen_string_literal: true

module AuthProviders
  class Base
    # Override in subclasses
    def authenticate_request(request)
      raise NotImplementedError
    end

    def sign_in(user, response)
      raise NotImplementedError
    end

    def sign_out(user, response)
      raise NotImplementedError
    end

    def current_user(request)
      raise NotImplementedError
    end
  end
end
