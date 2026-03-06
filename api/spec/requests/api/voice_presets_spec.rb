# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Voice Presets API", type: :request do
  let(:user) { create(:user) }

  before { sign_in user }

  describe "GET /api/voice_presets" do
    it "returns all voice presets" do
      create_list(:voice_preset, 3)
      get "/api/voice_presets", as: :json

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body.length).to eq(3)
      expect(body.first).to include("name", "provider", "voice_id", "settings")
    end

    it "returns empty array when no presets" do
      get "/api/voice_presets", as: :json
      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)).to eq([])
    end
  end

  describe "GET /api/voice_presets/:id" do
    it "returns a single preset" do
      preset = create(:voice_preset, name: "Rachel")
      get "/api/voice_presets/#{preset.id}", as: :json

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body["name"]).to eq("Rachel")
    end
  end

  describe "POST /api/voice_presets" do
    it "creates a new preset" do
      params = { voice_preset: { name: "NewVoice", provider: "elevenlabs", voice_id: "abc123", settings: { stability: 0.8 } } }

      expect { post "/api/voice_presets", params: params, as: :json }.to change(VoicePreset, :count).by(1)
      expect(response).to have_http_status(:created)
      expect(JSON.parse(response.body)["name"]).to eq("NewVoice")
    end

    it "returns errors for invalid preset" do
      post "/api/voice_presets", params: { voice_preset: { name: "", provider: "elevenlabs", voice_id: "" } }, as: :json
      expect(response).to have_http_status(:unprocessable_entity)
      expect(JSON.parse(response.body)["errors"]).to be_present
    end
  end

  describe "PATCH /api/voice_presets/:id" do
    let!(:preset) { create(:voice_preset) }

    it "updates the preset" do
      patch "/api/voice_presets/#{preset.id}", params: { voice_preset: { name: "Updated" } }, as: :json
      expect(response).to have_http_status(:ok)
      expect(preset.reload.name).to eq("Updated")
    end
  end

  describe "DELETE /api/voice_presets/:id" do
    let!(:preset) { create(:voice_preset) }

    it "deletes the preset" do
      expect { delete "/api/voice_presets/#{preset.id}", as: :json }.to change(VoicePreset, :count).by(-1)
      expect(response).to have_http_status(:no_content)
    end
  end

  context "when not authenticated" do
    before { sign_out user }

    it "returns unauthorized" do
      get "/api/voice_presets", as: :json
      expect(response).to have_http_status(:unauthorized)
    end
  end
end
