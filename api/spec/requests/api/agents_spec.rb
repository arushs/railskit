# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Agents API", type: :request do
  let(:user) { create(:user) }

  before { sign_in user }

  describe "POST /api/agents/:agent_name/chat" do
    let(:mock_response) do
      double(
        content: "Hello! How can I help?",
        model_id: "gpt-4o",
        input_tokens: 50,
        output_tokens: 25
      )
    end

    before do
      agent_instance = double(ask: mock_response)
      allow_any_instance_of(Api::AgentsController).to receive(:agent_class_name).and_return("HelpDeskAgent")
      allow(HelpDeskAgent).to receive(:new).and_return(agent_instance)
    end

    it "returns the agent response" do
      post "/api/agents/help_desk/chat",
           params: { message: "Hi there" },
           as: :json

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body["response"]).to eq("Hello! How can I help?")
      expect(body["conversation_id"]).to be_present
      expect(body["model"]).to eq("gpt-4o")
      expect(body["usage"]["input_tokens"]).to eq(50)
      expect(body["usage"]["output_tokens"]).to eq(25)
    end

    it "creates a conversation" do
      expect {
        post "/api/agents/help_desk/chat",
             params: { message: "Hi" },
             as: :json
      }.to change(Chat, :count).by(1)
    end

    it "reuses existing conversation" do
      chat = create(:chat, agent_class: "HelpDeskAgent")
      expect {
        post "/api/agents/help_desk/chat",
             params: { message: "Hi", conversation_id: chat.id },
             as: :json
      }.not_to change(Chat, :count)
    end
  end

  describe "POST /api/agents/:agent_name/stream" do
    before do
      allow(AgentStreamJob).to receive(:perform_later)
    end

    it "enqueues a streaming job and returns conversation_id" do
      post "/api/agents/help_desk/stream",
           params: { message: "Stream me" },
           as: :json

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body["conversation_id"]).to be_present
      expect(AgentStreamJob).to have_received(:perform_later).with(
        hash_including(message: "Stream me")
      )
    end

    it "persists the user message" do
      post "/api/agents/help_desk/stream",
           params: { message: "Hello stream" },
           as: :json

      conversation_id = response.parsed_body["conversation_id"]
      chat = Chat.find(conversation_id)
      expect(chat.messages.last.content).to eq("Hello stream")
      expect(chat.messages.last.role).to eq("user")
    end
  end
end
