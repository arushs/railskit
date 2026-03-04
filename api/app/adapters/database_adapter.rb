# frozen_string_literal: true

# Abstract interface for database adapters.
# Mirrors the PaymentProvider pattern — each adapter implements the same
# contract so app code stays database-agnostic.
#
# Adapters are selected via railskit.yml → database.adapter and resolved
# by the DatabaseAdapter.for(name) factory.
module DatabaseAdapter
  class Base
    # --------------- CRUD ---------------

    # Find a single record by primary key.
    # Returns a Hash with symbolised keys or nil.
    def find(table, id)
      raise NotImplementedError, "#{self.class}#find not implemented"
    end

    # Return an Array of Hashes matching +conditions+ (Hash).
    # +options+ may include :limit, :offset, :order.
    def where(table, conditions = {}, options = {})
      raise NotImplementedError, "#{self.class}#where not implemented"
    end

    # Insert a row. Returns the created record as a Hash.
    def create(table, attributes)
      raise NotImplementedError, "#{self.class}#create not implemented"
    end

    # Update a row by primary key. Returns the updated record as a Hash.
    def update(table, id, attributes)
      raise NotImplementedError, "#{self.class}#update not implemented"
    end

    # Delete a row by primary key. Returns true/false.
    def delete(table, id)
      raise NotImplementedError, "#{self.class}#delete not implemented"
    end

    # --------------- Query helpers ---------------

    # Count rows matching +conditions+.
    def count(table, conditions = {})
      raise NotImplementedError, "#{self.class}#count not implemented"
    end

    # Return all rows (convenience wrapper around #where).
    def all(table, options = {})
      where(table, {}, options)
    end

    # --------------- Schema / Migrations ---------------

    # Whether this adapter supports ActiveRecord-style migrations.
    def supports_migrations?
      false
    end

    # Execute a raw SQL string (only for adapters that support it).
    def execute(sql)
      raise NotImplementedError, "#{self.class}#execute not supported"
    end

    # --------------- Connection lifecycle ---------------

    def connected?
      raise NotImplementedError, "#{self.class}#connected? not implemented"
    end

    def disconnect!
      # no-op by default
    end
  end

  # ------------- Factory ---------------

  ADAPTERS = {
    "postgresql" => "DatabaseAdapter::PostgresqlAdapter",
    "supabase"   => "DatabaseAdapter::SupabaseAdapter",
    "convex"     => "DatabaseAdapter::ConvexAdapter"
  }.freeze

  class << self
    # Returns a singleton adapter instance for the given name (or the
    # configured default).
    def for(name = nil)
      name ||= RailsKit.config.database.adapter
      klass_name = ADAPTERS.fetch(name.to_s) do
        raise ArgumentError, "Unknown database adapter: #{name}. Valid: #{ADAPTERS.keys.join(', ')}"
      end
      klass_name.constantize.new
    end

    # Convenience — the currently active adapter.
    def current
      @current ||= self.for
    end

    def current=(adapter)
      @current = adapter
    end

    def reset!
      @current = nil
    end
  end
end
