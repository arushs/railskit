# frozen_string_literal: true

# BaseWorkflow provides a step-based DSL for multi-agent orchestration.
#
# Define workflows as a series of named steps that execute agents,
# apply conditions, and route to the next step:
#
#   class MyWorkflow < BaseWorkflow
#     step :triage do |ctx|
#       agent = TriageAgent.new(conversation: ctx[:conversation])
#       response = agent.ask(ctx[:message])
#       ctx[:triage_result] = response.content
#       ctx[:category] = extract_category(response.content)
#     end
#
#     step :route, if: -> (ctx) { ctx[:category] == "billing" } do |ctx|
#       agent = BillingAgent.new(conversation: ctx[:conversation])
#       ctx[:response] = agent.ask(ctx[:message])
#     end
#
#     step :fallback do |ctx|
#       agent = HelpDeskAgent.new(conversation: ctx[:conversation])
#       ctx[:response] = agent.ask(ctx[:message])
#     end
#   end
#
#   result = MyWorkflow.run(message: "refund please", conversation: chat)
#   result[:response] # => final response
#
class BaseWorkflow
  StepDef = Data.define(:name, :block, :condition, :on_error)

  class << self
    def steps
      @steps ||= []
    end

    # Declare a workflow step.
    #
    # Options:
    #   if:       Lambda that receives context — step runs only if truthy (default: always)
    #   on_error: :skip | :halt | :retry | Proc  (default: :halt)
    def step(name, if: nil, on_error: :halt, &block)
      steps << StepDef.new(
        name: name,
        block: block,
        condition: binding.local_variable_get(:if),
        on_error: on_error
      )
    end

    # Execute the workflow. Returns the final context hash.
    def run(**initial_context)
      new.run(**initial_context)
    end
  end

  def run(**initial_context)
    ctx = initial_context.dup
    ctx[:_steps_executed] = []
    ctx[:_steps_skipped] = []
    ctx[:_errors] = []
    ctx[:_started_at] = Time.current

    self.class.steps.each do |step_def|
      # Evaluate condition
      if step_def.condition && !step_def.condition.call(ctx)
        ctx[:_steps_skipped] << step_def.name
        next
      end

      begin
        ctx[:_current_step] = step_def.name
        step_def.block.call(ctx)
        ctx[:_steps_executed] << step_def.name
      rescue StandardError => e
        ctx[:_errors] << { step: step_def.name, error: e.message, backtrace: e.backtrace&.first(3) }

        case step_def.on_error
        when :skip
          ctx[:_steps_skipped] << step_def.name
          Rails.logger.warn("[Workflow] Step #{step_def.name} failed, skipping: #{e.message}")
          next
        when :retry
          begin
            step_def.block.call(ctx)
            ctx[:_steps_executed] << step_def.name
          rescue StandardError => retry_error
            ctx[:_errors] << { step: step_def.name, error: "retry failed: #{retry_error.message}" }
            Rails.logger.error("[Workflow] Step #{step_def.name} retry failed: #{retry_error.message}")
            break
          end
        when Proc
          step_def.on_error.call(ctx, e)
        else # :halt
          Rails.logger.error("[Workflow] Step #{step_def.name} halted: #{e.message}")
          break
        end
      end
    end

    ctx[:_completed_at] = Time.current
    ctx[:_duration_ms] = ((ctx[:_completed_at] - ctx[:_started_at]) * 1000).round

    # Call after_complete hook if defined
    after_complete(ctx) if respond_to?(:after_complete, true)

    ctx
  end
end
