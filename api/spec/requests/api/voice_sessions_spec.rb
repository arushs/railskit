# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Voice Sessions API", type: :request do
  let(:user) { create(:user) }

  before { sign_in user }

  describe "GET /api/voice_sessions" do
    it "lists user's sessions" do
      create_list(:voice_session, 3, user: user)

      get "/api/voice_sessions", as: :json
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.size).to eq(3)
    end

    it "does not include other users' sessions" do
      other = create(:user)
      create(:voice_session, user: other)
      create(:voice_session, user: user)

      get "/api/voice_sessions", as: :json
      expect(response.parsed_body.size).to eq(1)
    end
  end

  describe "GET /api/voice_sessions/:id" do
    it "returns session details" do
      session = create(:voice_session, user: user)

      get "/api/voice_sessions/#{session.id}", as: :json
      expect(response).to have_http_status(:ok)

      body = response.parsed_body
      expect(body["id"]).to eq(session.id)
      expect(body["status"]).to eq("idle")
      expect(body["stt_provider"]).to eq("openai")
      expect(body["tts_voice"]).to eq("alloy")
    end
  end

  describe "POST /api/voice_sessions" do
    it "creates a new session" do
      expect {
        post "/api/voice_sessions",
             params: { agent_class: "HelpDeskAgent", tts_voice: "nova" },
             as: :json
      }.to change(VoiceSession, :count).by(1)

      expect(response).to have_http_status(:created)
      expect(response.parsed_body["tts_voice"]).to eq("nova")
    end

    it "uses defaults when no params given" do
      post "/api/voice_sessions", as: :json
      expect(response).to have_http_status(:created)
      expect(response.parsed_body["stt_provider"]).to be_present
    end
  end

  describe "DELETE /api/voice_sessions/:id" do
    it "destroys the session" do
      session = create(:voice_session, user: user)

      expect {
        delete "/api/voice_sessions/#{session.id}", as: :json
      }.to change(VoiceSession, :count).by(-1)

      expect(response).to have_http_status(:no_content)
    end
  end
end
