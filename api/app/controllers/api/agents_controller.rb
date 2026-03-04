# frozen_string_literal: true

module Api
  class AgentsController < ApplicationController
    def chat
      conversation = find_or_create_conversation
      agent = agent_class_name.constantize.new(conversation: conversation)
      response = agent.ask(params[:message])

      render json: {
        response: response.content,
        conversation_id: conversation.id,
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

    private

    def find_or_create_conversation
      params[:conversation_id].present? ? Chat.find(params[:conversation_id]) : Chat.create!(agent_class: agent_class_name)
    end

    def agent_class_name = "#{params[:agent_name].classify}Agent"
  end
end
