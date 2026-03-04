# frozen_string_literal: true

module Api
  class ConfigController < ApplicationController
    # GET /api/config
    # Returns frontend-safe configuration from railskit.yml
    # No authentication required — this is public config only.
    def show
      render json: RailsKit.config.frontend_safe
    end
  end
end
