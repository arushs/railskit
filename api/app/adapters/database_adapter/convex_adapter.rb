# frozen_string_literal: true

module DatabaseAdapter
  # Stub adapter for Convex.
  #
  # Convex is a fundamentally different paradigm (reactive queries,
  # server functions, no SQL) so a thin CRUD wrapper doesn't make
  # sense. This adapter exists solely to satisfy the interface contract
  # and give clear errors if someone selects it.
  #
  # If you're using Convex, interact with it directly via its JS/TS
  # SDK on the frontend or through HTTP actions.
  class ConvexAdapter < Base
    CONVEX_MSG = "Convex uses a reactive function model — use the Convex SDK directly instead of the DatabaseAdapter interface."

    def find(*)
      raise NotImplementedError, CONVEX_MSG
    end

    def where(*)
      raise NotImplementedError, CONVEX_MSG
    end

    def create(*)
      raise NotImplementedError, CONVEX_MSG
    end

    def update(*)
      raise NotImplementedError, CONVEX_MSG
    end

    def delete(*)
      raise NotImplementedError, CONVEX_MSG
    end

    def count(*)
      raise NotImplementedError, CONVEX_MSG
    end

    def supports_migrations?
      false
    end

    def execute(*)
      raise NotImplementedError, CONVEX_MSG
    end

    def connected?
      false # Not applicable
    end
  end
end
