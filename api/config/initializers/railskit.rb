# frozen_string_literal: true

# RailsKit configuration loader
# Reads from railskit.yml at the monorepo root, falling back to defaults.
module RailsKit
  CONFIG_PATH = Rails.root.join("..", "railskit.yml")

  DEFAULTS = {
    ai: {
      default_provider: "openai",
      default_model: "gpt-4o"
    }
  }.freeze

  class << self
    def config
      @config ||= load_config
    end

    def reload!
      @config = load_config
    end

    private

    def load_config
      if File.exist?(CONFIG_PATH)
        yaml = YAML.safe_load_file(CONFIG_PATH, symbolize_names: true) || {}
        deep_merge(DEFAULTS, yaml)
      else
        DEFAULTS
      end
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
