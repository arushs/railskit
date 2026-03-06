# frozen_string_literal: true

module Api
  class WorkflowsController < ApplicationController
    before_action :set_workflow, only: [:show, :update, :destroy]

    # GET /api/workflows
    def index
      workflows = AgentWorkflow.order(created_at: :desc)
      render json: workflows
    end

    # GET /api/workflows/:id
    def show
      render json: @workflow
    end

    # POST /api/workflows
    def create
      workflow = AgentWorkflow.new(workflow_params)

      if workflow.save
        render json: workflow, status: :created
      else
        render json: { errors: workflow.errors.full_messages }, status: :unprocessable_entity
      end
    end

    # PATCH/PUT /api/workflows/:id
    def update
      if @workflow.update(workflow_params)
        render json: @workflow
      else
        render json: { errors: @workflow.errors.full_messages }, status: :unprocessable_entity
      end
    end

    # DELETE /api/workflows/:id
    def destroy
      @workflow.destroy!
      head :no_content
    end

    private

    def set_workflow
      @workflow = AgentWorkflow.find(params[:id])
    end

    def workflow_params
      params.require(:workflow).permit(:name, :description, :coordinator_agent, config: {})
    end
  end
end
