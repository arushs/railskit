# frozen_string_literal: true

# Load the database adapter layer and set the active adapter
# based on railskit.yml → database.adapter.
require_relative "../../app/adapters/database_adapter"
require_relative "../../app/adapters/database_adapter/postgresql_adapter"
require_relative "../../app/adapters/database_adapter/supabase_adapter"
require_relative "../../app/adapters/database_adapter/convex_adapter"

Rails.application.config.after_initialize do
  adapter_name = RailsKit.config.database.adapter
  DatabaseAdapter.current = DatabaseAdapter.for(adapter_name)

  Rails.logger.info("[RailsKit] Database adapter: #{adapter_name} → #{DatabaseAdapter.current.class}")
end
