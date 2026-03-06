# frozen_string_literal: true

module Api
  class WorkflowRunsController < ApplicationController
    before_action :set_workflow, only: [:index, :create]
    before_action :set_workflow_run, only: [:show, :invocations]

    # GET /api/workflows/:workflow_id/runs
    def index
      runs = @workflow.workflow_runs.order(created_at: :desc)
      render json: runs
    end

    # POST /api/workflows/:workflow_id/runs
    def create
      run = @workflow.workflow_runs.new(run_params.merge(status: "pending"))

      if run.save
        render json: run, status: :created
      else
        render json: { errors: run.errors.full_messages }, status: :unprocessable_entity
      end
    end

    # GET /api/workflow_runs/:id
    def show
      render json: @run.as_json(include: {
        agent_invocations: { order: :created_at },
        shared_contexts: {}
      })
    end

    # GET /api/workflow_runs/:id/invocations
    def invocations
      invocations = @run.agent_invocations
                        .includes(:child_invocations)
                        .order(:created_at)

      render json: invocations.as_json(include: :child_invocations)
    end

    private

    def set_workflow
      @workflow = AgentWorkflow.find(params[:workflow_id])
    end

    def set_workflow_run
      @run = WorkflowRun.find(params[:id])
    end

    def run_params
      params.require(:run).permit(input: {}, context: {})
    end
  end
end
