# frozen_string_literal: true

module Api
  class ConversationsController < ApplicationController
    before_action :authenticate_user!
    before_action :set_conversation, only: %i[show update destroy messages]

    # GET /api/conversations
    def index
      conversations = current_user.conversations.recent
        .select(:id, :title, :model, :provider, :updated_at, :created_at)
        .limit(params[:limit] || 50)
        .offset(params[:offset] || 0)

      render json: { conversations: conversations }
    end

    # GET /api/conversations/:id
    def show
      render json: {
        conversation: @conversation.as_json(
          include: { messages: { only: %i[id role content tool_calls tool_call_id name finish_reason token_count cost_cents created_at] } }
        )
      }
    end

    # POST /api/conversations
    def create
      conversation = current_user.conversations.build(conversation_params)

      if conversation.save
        render json: { conversation: conversation }, status: :created
      else
        render json: { errors: conversation.errors.full_messages }, status: :unprocessable_entity
      end
    end

    # PATCH /api/conversations/:id
    def update
      if @conversation.update(conversation_params)
        render json: { conversation: @conversation }
      else
        render json: { errors: @conversation.errors.full_messages }, status: :unprocessable_entity
      end
    end

    # DELETE /api/conversations/:id
    def destroy
      @conversation.destroy
      head :no_content
    end

    # GET /api/conversations/:id/messages
    def messages
      msgs = @conversation.messages.chronological
        .limit(params[:limit] || 100)
        .offset(params[:offset] || 0)

      render json: { messages: msgs }
    end

    private

    def set_conversation
      @conversation = current_user.conversations.find(params[:id])
    end

    def conversation_params
      params.require(:conversation).permit(:title, :model, :provider, :system_prompt, metadata: {})
    end
  end
end
