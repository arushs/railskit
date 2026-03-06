# frozen_string_literal: true

module Railskit
  module Generators
    class WorkflowGenerator < Rails::Generators::NamedBase
      source_root File.expand_path("templates", __dir__)

      argument :steps, type: :array, default: [], banner: "step1 step2 step3"

      class_option :agents, type: :array, default: [],
        desc: "Agent classes to reference (e.g., BillingAgent HelpDeskAgent)"

      desc "Generate a RailsKit workflow with named steps"

      def create_workflow_file
        template "workflow.rb.tt", File.join("app/workflows", "#{file_name}_workflow.rb")
      end

      def create_workflow_spec
        template "workflow_spec.rb.tt", File.join("spec/workflows", "#{file_name}_workflow_spec.rb")
      end

      private

      def workflow_class_name
        "#{class_name}Workflow"
      end

      def workflow_steps
        return [{ name: "process", desc: "Main processing step" }] if steps.empty?

        steps.map { |s| { name: s.underscore, desc: s.humanize } }
      end

      def agent_classes
        options[:agents].presence || ["HelpDeskAgent"]
      end
    end
  end
end
