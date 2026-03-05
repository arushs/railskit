# frozen_string_literal: true

module Api
  class AgentsController < ApplicationController
    # Non-streaming chat — returns full response at once
    def chat
      chat = find_or_create_chat
      agent = agent_class_name.constantize.new(chat: chat)
      response = agent.ask(params[:message])

      render json: {
        response: response.content,
        chat_id: chat.id,
        model: response.respond_to?(:model_id) ? response.model_id : nil,
        usage: {
          input_tokens: response.respond_to?(:input_tokens) ? response.input_tokens : nil,
          output_tokens: response.respond_to?(:output_tokens) ? response.output_tokens : nil
        }
      }
    rescue => e
      Rails.logger.error("[AgentsController] #{e.class}: #{e.message}")
      render json: { error: "Something went wrong." }, status: :internal_server_error
    end

    # Streaming chat — creates chat, enqueues streaming job,
    # returns chat_id for the client to subscribe via ActionCable.
    def stream_chat
      chat = find_or_create_chat

      # Persist user message immediately so the frontend can display it
      chat.persist_message(role: "user", content: params[:message])

      # Enqueue background job to stream via ActionCable
      AgentStreamJob.perform_later(
        chat_id: chat.id,
        agent_name: params[:agent_name],
        message: params[:message]
      )

      render json: { chat_id: chat.id }
    rescue => e
      Rails.logger.error("[AgentsController#stream_chat] #{e.class}: #{e.message}")
      render json: { error: "Something went wrong." }, status: :internal_server_error
    end

    private

    def find_or_create_chat
      params[:chat_id].present? ? Chat.find(params[:chat_id]) : Chat.create!(agent_class: agent_class_name)
    end

    def agent_class_name = "#{params[:agent_name].classify}Agent"
  end
end
