# frozen_string_literal: true

module RailsKit
  # Base class for agents that participate in multi-agent workflows.
  # Extends the standard agent pattern with orchestration primitives:
  # routing, handoff, delegation, and shared context.
  #
  # Usage:
  #   class CoordinatorAgent < RailsKit::OrchestratedAgent
  #     description "Routes customer requests to the right specialist"
  #     capabilities :routing, :triage
  #
  #     def initialize(workflow_run:, **opts)
  #       super
  #       routes_to BillingAgent, TechnicalAgent
  #     end
  #   end
  #
  class OrchestratedAgent
    class_attribute :agent_capabilities, default: []
    class_attribute :agent_description, default: ""

    attr_reader :workflow_run, :invocation

    # DSL: declare what this agent can do
    def self.capabilities(*caps)
      self.agent_capabilities = caps.map(&:to_sym)
    end

    # DSL: human-readable description of this agent's role
    def self.description(desc)
      self.agent_description = desc
    end

    def initialize(workflow_run: nil, parent_invocation: nil, model: nil)
      @workflow_run = workflow_run
      @parent_invocation = parent_invocation
      @routable_agents = []
      @model = model

      # Create an invocation record if we're part of a workflow
      if @workflow_run
        role = @parent_invocation ? "specialist" : "coordinator"
        @invocation = AgentInvocation.create!(
          workflow_run: @workflow_run,
          agent_name: self.class.name,
          role: role,
          parent_invocation: @parent_invocation,
          status: "running",
          started_at: Time.current
        )

        broadcast_event("workflow_status", {
          workflow_run_id: @workflow_run.id,
          agent: self.class.name,
          role: role,
          status: "running"
        })
      end
    end

    # Transfer conversation to another agent. The current agent stops and
    # the target agent takes over with full context.
    #
    # @param agent_class [Class] the OrchestratedAgent subclass to hand off to
    # @param context [Hash] additional context to pass
    # @param reason [String] human-readable reason for the handoff
    # @return [OrchestratedAgent] the new active agent
    def hand_off_to(agent_class, context: {}, reason: "")
      validate_agent_class!(agent_class)

      # Persist context for the receiving agent
      if @workflow_run
        SharedContext.merge(context, workflow_run: @workflow_run, writer: self.class.name) if context.any?
        SharedContext.write("_last_handoff_reason", reason, workflow_run: @workflow_run, writer: self.class.name) if reason.present?

        @invocation&.complete!(output: { handed_off_to: agent_class.name, reason: reason })

        broadcast_event("handoff", {
          workflow_run_id: @workflow_run.id,
          from_agent: self.class.name,
          to_agent: agent_class.name,
          reason: reason
        })
      end

      # Instantiate the target agent within the same workflow
      agent_class.new(
        workflow_run: @workflow_run,
        parent_invocation: @parent_invocation,
        model: @model
      )
    end

    # Delegate a subtask to another agent. This agent continues after
    # receiving the result. Runs synchronously — the delegate completes
    # before this agent proceeds.
    #
    # @param agent_class [Class] the OrchestratedAgent subclass to delegate to
    # @param task [String] description of the subtask
    # @param context [Hash] additional context
    # @return [Hash] the delegate's output
    def delegate_to(agent_class, task:, context: {})
      validate_agent_class!(agent_class)

      if @workflow_run
        SharedContext.merge(context, workflow_run: @workflow_run, writer: self.class.name) if context.any?

        broadcast_event("delegation", {
          workflow_run_id: @workflow_run.id,
          from_agent: self.class.name,
          to_agent: agent_class.name,
          task: task
        })
      end

      delegate = agent_class.new(
        workflow_run: @workflow_run,
        parent_invocation: @invocation,
        model: @model
      )

      # The delegate processes the task and returns its output
      result = delegate.execute(task: task, context: context)
      result
    end

    # Register agent classes this coordinator can route to.
    #
    # @param agent_classes [Array<Class>] OrchestratedAgent subclasses
    def routes_to(*agent_classes)
      agent_classes.each do |klass|
        validate_agent_class!(klass)
        @routable_agents << klass unless @routable_agents.include?(klass)
      end
    end

    # Execute a task. Subclasses should override this.
    #
    # @param task [String] the task description
    # @param context [Hash] context from shared store or caller
    # @return [Hash] output from this agent
    def execute(task:, context: {})
      raise NotImplementedError, "#{self.class.name} must implement #execute"
    end

    # Read from the workflow's shared context
    def read_context(key)
      return nil unless @workflow_run
      SharedContext.read(key, workflow_run: @workflow_run)
    end

    # Write to the workflow's shared context
    def write_context(key, value)
      return unless @workflow_run
      ctx = SharedContext.write(key, value, workflow_run: @workflow_run, writer: self.class.name)

      broadcast_event("context_update", {
        workflow_run_id: @workflow_run.id,
        key: key,
        written_by: self.class.name
      })

      ctx
    end

    # Complete this agent's invocation with output
    def complete!(output = {})
      @invocation&.complete!(output: output)
    end

    # Mark this agent's invocation as failed
    def fail!(output = {})
      @invocation&.fail!(output: output)
    end

    # List agents this coordinator can route to
    def routable_agents
      @routable_agents.dup
    end

    private

    def validate_agent_class!(klass)
      unless klass.is_a?(Class) && klass < RailsKit::OrchestratedAgent
        raise ArgumentError, "#{klass} must be a subclass of RailsKit::OrchestratedAgent"
      end
    end

    def broadcast_event(event_type, payload)
      return unless @workflow_run

      ActionCable.server.broadcast(
        "workflow_#{@workflow_run.id}",
        { type: event_type, **payload, timestamp: Time.current.iso8601 }
      )
    rescue => e
      Rails.logger.warn("[OrchestratedAgent] Failed to broadcast #{event_type}: #{e.message}")
    end
  end
end
