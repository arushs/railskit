# frozen_string_literal: true

require "rails_helper"

RSpec.describe Voice::STTService do
  describe ".transcribe" do
    let(:audio_data) { "fake_audio_bytes" }

    context "with OpenAI provider" do
      before { ENV["OPENAI_API_KEY"] = "test-key" }

      it "returns transcribed text" do
        stub_request(:post, "https://api.openai.com/v1/audio/transcriptions")
          .to_return(
            status: 200,
            body: { text: "Hello, how can I help?" }.to_json,
            headers: { "Content-Type" => "application/json" }
          )

        result = described_class.transcribe(audio_data, provider: "openai")
        expect(result).to eq("Hello, how can I help?")
      end

      it "raises on API error" do
        stub_request(:post, "https://api.openai.com/v1/audio/transcriptions")
          .to_return(status: 500, body: "Internal error")

        expect {
          described_class.transcribe(audio_data, provider: "openai")
        }.to raise_error(Voice::STTService::TranscriptionError)
      end
    end

    context "with Deepgram provider" do
      before { ENV["DEEPGRAM_API_KEY"] = "test-key" }

      it "returns transcribed text" do
        stub_request(:post, /api\.deepgram\.com/)
          .to_return(
            status: 200,
            body: {
              results: {
                channels: [{ alternatives: [{ transcript: "Hello from Deepgram" }] }]
              }
            }.to_json,
            headers: { "Content-Type" => "application/json" }
          )

        result = described_class.transcribe(audio_data, provider: "deepgram")
        expect(result).to eq("Hello from Deepgram")
      end
    end

    it "raises on unsupported provider" do
      expect {
        described_class.transcribe(audio_data, provider: "invalid")
      }.to raise_error(Voice::STTService::TranscriptionError, /Unsupported/)
    end
  end
end
