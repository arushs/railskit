# frozen_string_literal: true

# ============================================================================
# RailsKit Configuration Initializer
# ============================================================================
# Reads railskit.yml and exposes it as RailsKit.config throughout the app.
# Access any value: RailsKit.config.app.name, RailsKit.config.payments.provider, etc.
# ============================================================================

require "yaml"
require "ostruct"

module RailsKit
  class Config
    attr_reader :raw

    CONFIG_PATHS = [
      -> { Rails.root.join("config", "railskit.yml") },  # api/config/railskit.yml
      -> { Rails.root.join("..", "railskit.yml") },       # monorepo root railskit.yml
    ].freeze

    DEFAULTS = {
      "app" => {
        "name" => "MyApp",
        "tagline" => "Ship your SaaS in a weekend",
        "domain" => "localhost",
        "support_email" => "support@example.com",
      },
      "database" => {
        "adapter" => "postgresql",
      },
      "auth" => {
        "provider" => "devise",
        "jwt_expiry_hours" => 24,
        "enable_registration" => true,
        "enable_magic_link" => false,
        "oauth" => { "google" => false, "github" => false },
      },
      "payments" => {
        "provider" => "stripe",
        "plans" => [
          {
            "id" => "free",
            "name" => "Free",
            "price_monthly" => 0,
            "price_yearly" => 0,
            "stripe_monthly_price_id" => "",
            "stripe_yearly_price_id" => "",
            "features" => ["1 project", "Basic analytics", "Community support"],
          },
        ],
      },
      "email" => {
        "provider" => "resend",
        "from" => "noreply@example.com",
        "reply_to" => "support@example.com",
      },
      "ai" => {
        "provider" => "none",
        "default_model" => "gpt-4o-mini",
      },
      "theme" => {
        "color_scheme" => "zinc",
        "primary_color" => "#6366f1",
        "dark_mode" => true,
        "font" => "Inter",
        "border_radius" => "0.5rem",
        "logo_url" => "",
      },
      "seo" => {
        "title" => "MyApp — Ship your SaaS in a weekend",
        "description" => "The fastest way to launch your SaaS.",
        "og_image" => "/og-image.png",
        "twitter_handle" => "",
        "google_analytics_id" => "",
      },
      "features" => {
        "blog" => false,
        "admin_panel" => false,
        "teams" => false,
        "api_keys" => false,
        "notifications" => false,
      },
    }.freeze

    def initialize
      @raw = deep_merge(DEFAULTS, load_config)
      freeze_config!
    end

    # Top-level accessors: RailsKit.config.app, RailsKit.config.auth, etc.
    %w[app database auth payments email ai theme seo features].each do |section|
      define_method(section) do
        instance_variable_get(:"@#{section}")
      end
    end

    # Hash-style access: RailsKit.config[:app][:name]
    def [](key)
      @raw[key.to_s]
    end

    # Full config as plain hash (useful for serialization / API endpoint)
    def to_h
      @raw
    end

    # Returns only the keys safe to expose to the frontend (no secrets)
    def frontend_safe
      {
        "app" => @raw["app"],
        "theme" => @raw["theme"],
        "seo" => @raw["seo"],
        "features" => @raw["features"],
        "auth" => {
          "enable_registration" => @raw.dig("auth", "enable_registration"),
          "enable_magic_link" => @raw.dig("auth", "enable_magic_link"),
          "oauth" => @raw.dig("auth", "oauth"),
        },
        "payments" => {
          "provider" => @raw.dig("payments", "provider"),
          "plans" => (@raw.dig("payments", "plans") || []).map do |plan|
            plan.except("stripe_monthly_price_id", "stripe_yearly_price_id")
          end,
        },
      }
    end

    private

    def load_config
      path = CONFIG_PATHS.map(&:call).find { |p| File.exist?(p) }
      return {} unless path

      yaml = File.read(path)
      # Support ERB in config (for env vars: <%= ENV['FOO'] %>)
      yaml = ERB.new(yaml).result if defined?(ERB)
      YAML.safe_load(yaml, permitted_classes: [Symbol]) || {}
    rescue => e
      Rails.logger.error "[RailsKit] Failed to load config: #{e.message}"
      {}
    end

    def deep_merge(base, override)
      base.merge(override) do |_key, old_val, new_val|
        if old_val.is_a?(Hash) && new_val.is_a?(Hash)
          deep_merge(old_val, new_val)
        else
          new_val.nil? ? old_val : new_val
        end
      end
    end

    def freeze_config!
      %w[app database auth payments email ai theme seo features].each do |section|
        data = @raw[section] || {}
        instance_variable_set(:"@#{section}", to_open_struct(data))
      end
    end

    def to_open_struct(hash)
      return hash unless hash.is_a?(Hash)

      OpenStruct.new(hash.transform_values { |v|
        case v
        when Hash then to_open_struct(v)
        when Array then v.map { |item| item.is_a?(Hash) ? to_open_struct(item) : item }
        else v
        end
      })
    end
  end

  class << self
    def config
      @config ||= Config.new
    end

    def reload!
      @config = Config.new
    end
  end
end

# Eager-load config on boot
RailsKit.config

Rails.logger.info "[RailsKit] Loaded config for '#{RailsKit.config.app.name}' (#{Rails.env})"
