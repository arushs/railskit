# frozen_string_literal: true

module DatabaseAdapter
  # Default adapter — delegates to ActiveRecord directly.
  # This is the happy path for standard Rails/PostgreSQL deployments.
  class PostgresqlAdapter < Base
    def find(table, id)
      model_for(table).find_by(id: id)&.attributes&.symbolize_keys
    end

    def where(table, conditions = {}, options = {})
      scope = model_for(table).where(conditions)
      scope = scope.order(options[:order]) if options[:order]
      scope = scope.limit(options[:limit])   if options[:limit]
      scope = scope.offset(options[:offset]) if options[:offset]
      scope.map { |r| r.attributes.symbolize_keys }
    end

    def create(table, attributes)
      record = model_for(table).create!(attributes)
      record.attributes.symbolize_keys
    end

    def update(table, id, attributes)
      record = model_for(table).find(id)
      record.update!(attributes)
      record.reload.attributes.symbolize_keys
    end

    def delete(table, id)
      record = model_for(table).find_by(id: id)
      return false unless record

      record.destroy!
      true
    end

    def count(table, conditions = {})
      model_for(table).where(conditions).count
    end

    def supports_migrations?
      true
    end

    def execute(sql)
      ActiveRecord::Base.connection.execute(sql)
    end

    def connected?
      ActiveRecord::Base.connection.active?
    rescue StandardError
      false
    end

    def disconnect!
      ActiveRecord::Base.connection.close
    end

    private

    # Resolve a table name (string or symbol) to an ActiveRecord model.
    # Tries the classified name first (e.g. :users → User), then falls
    # back to a dynamic Arel-based lookup.
    def model_for(table)
      table.to_s.classify.constantize
    rescue NameError
      # Fallback: create an anonymous AR model scoped to the table.
      Class.new(ActiveRecord::Base) { self.table_name = table.to_s }
    end
  end
end
