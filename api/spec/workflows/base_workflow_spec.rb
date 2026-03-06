# frozen_string_literal: true

require "rails_helper"

RSpec.describe BaseWorkflow do
  describe "step execution" do
    let(:workflow_class) do
      Class.new(described_class) do
        step :first do |ctx|
          ctx[:log] ||= []
          ctx[:log] << :first
        end

        step :second do |ctx|
          ctx[:log] << :second
        end
      end
    end

    it "executes steps in order" do
      result = workflow_class.run
      expect(result[:log]).to eq(%i[first second])
      expect(result[:_steps_executed]).to eq(%i[first second])
    end

    it "tracks timing" do
      result = workflow_class.run
      expect(result[:_started_at]).to be_present
      expect(result[:_completed_at]).to be_present
      expect(result[:_duration_ms]).to be >= 0
    end
  end

  describe "conditional steps" do
    let(:workflow_class) do
      Class.new(described_class) do
        step :always do |ctx|
          ctx[:ran] = true
        end

        step :conditional, if: ->(ctx) { ctx[:run_me] } do |ctx|
          ctx[:conditional_ran] = true
        end
      end
    end

    it "skips steps when condition is false" do
      result = workflow_class.run(run_me: false)
      expect(result[:_steps_skipped]).to include(:conditional)
      expect(result[:conditional_ran]).to be_nil
    end

    it "runs steps when condition is true" do
      result = workflow_class.run(run_me: true)
      expect(result[:_steps_executed]).to include(:conditional)
      expect(result[:conditional_ran]).to be true
    end
  end

  describe "error handling" do
    context "with on_error: :halt (default)" do
      let(:workflow_class) do
        Class.new(described_class) do
          step :boom do |_ctx|
            raise "kaboom"
          end

          step :after do |ctx|
            ctx[:after_ran] = true
          end
        end
      end

      it "halts execution on error" do
        result = workflow_class.run
        expect(result[:_errors].size).to eq(1)
        expect(result[:_errors].first[:step]).to eq(:boom)
        expect(result[:after_ran]).to be_nil
      end
    end

    context "with on_error: :skip" do
      let(:workflow_class) do
        Class.new(described_class) do
          step :boom, on_error: :skip do |_ctx|
            raise "kaboom"
          end

          step :after do |ctx|
            ctx[:after_ran] = true
          end
        end
      end

      it "skips the failing step and continues" do
        result = workflow_class.run
        expect(result[:_errors].size).to eq(1)
        expect(result[:after_ran]).to be true
      end
    end
  end

  describe "initial context" do
    let(:workflow_class) do
      Class.new(described_class) do
        step :check do |ctx|
          ctx[:saw_input] = ctx[:input]
        end
      end
    end

    it "passes initial context to steps" do
      result = workflow_class.run(input: "hello")
      expect(result[:saw_input]).to eq("hello")
    end
  end
end
