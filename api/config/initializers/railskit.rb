# frozen_string_literal: true

require "yaml"
require "json"

# RailsKit configuration loader
# Reads from railskit.yml at the monorepo root and exposes it as
# RailsKit.config with dot-notation access (e.g. RailsKit.config.app.name).
module RailsKit
  CONFIG_PATH = Rails.root.join("..", "railskit.yml").freeze

  DEFAULTS = {
    app: { name: "RailsKit", domain: "localhost" },
    database: { adapter: "postgresql" },
    auth: { provider: "devise", google_oauth: true, magic_links: true },
    payments: { provider: "stripe" },
    email: { provider: "resend" },
    ai: { provider: "openai", model: "gpt-4o" },
    theme: { primary_color: "#6366f1", dark_mode: true }
  }.freeze

  # Recursive OpenStruct-like wrapper for dot-notation access.
  class ConfigNode
    def initialize(hash = {})
      @data = {}
      hash.each do |key, value|
        @data[key.to_sym] = value.is_a?(Hash) ? ConfigNode.new(value) : value
      end
    end

    def method_missing(name, *args)
      key = name.to_sym
      return @data[key] if @data.key?(key)

      super
    end

    def respond_to_missing?(name, include_private = false)
      @data.key?(name.to_sym) || super
    end

    def [](key)
      @data[key.to_sym]
    end

    def to_h
      @data.transform_values { |v| v.is_a?(ConfigNode) ? v.to_h : v }
    end

    def to_json(*args)
      to_h.to_json(*args)
    end

    def inspect
      "#<RailsKit::ConfigNode #{to_h.inspect}>"
    end
  end

  class << self
    def config
      @config ||= load_config
    end

    def reload!
      @config = load_config
    end

    # Generate a JSON file for the frontend to consume.
    # Called via: rails railskit:generate_frontend_config
    def generate_frontend_json(output_path = nil)
      output_path ||= Rails.root.join("..", "web", "src", "railskit.generated.json")
      File.write(output_path, JSON.pretty_generate(config.to_h))
      output_path
    end

    private

    def load_config
      raw = if File.exist?(CONFIG_PATH)
              YAML.safe_load_file(CONFIG_PATH, symbolize_names: true) || {}
            else
              Rails.logger.warn("[RailsKit] #{CONFIG_PATH} not found — using defaults")
              {}
            end

      merged = deep_merge(DEFAULTS, raw)
      ConfigNode.new(merged)
    end

    def deep_merge(base, override)
      base.merge(override) do |_key, old_val, new_val|
        if old_val.is_a?(Hash) && new_val.is_a?(Hash)
          deep_merge(old_val, new_val)
        else
          new_val
        end
      end
    end
  end
end
