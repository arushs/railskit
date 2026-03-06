# frozen_string_literal: true

require "rails_helper"

RSpec.describe Voice::STTService do
  let(:audio_data) { "fake-audio-bytes" }

  before do
    allow(ENV).to receive(:fetch).with("OPENAI_API_KEY").and_return("test-key")
    allow(ENV).to receive(:fetch).with("OPENAI_BASE_URL", anything).and_return("https://api.openai.com/v1")
  end

  describe ".transcribe" do
    context "with openai provider" do
      it "returns transcribed text" do
        stub_request(:post, "https://api.openai.com/v1/audio/transcriptions")
          .to_return(status: 200, body: { text: "Hello world" }.to_json, headers: { "Content-Type" => "application/json" })

        result = described_class.transcribe(audio_data, format: "webm", provider: "openai")
        expect(result).to eq("Hello world")
      end

      it "raises TranscriptionError on API failure" do
        stub_request(:post, "https://api.openai.com/v1/audio/transcriptions")
          .to_return(status: 500, body: "Server Error")

        expect {
          described_class.transcribe(audio_data, provider: "openai")
        }.to raise_error(Voice::STTService::TranscriptionError, /OpenAI STT error: 500/)
      end
    end

    context "with deepgram provider" do
      before do
        allow(ENV).to receive(:fetch).with("DEEPGRAM_API_KEY").and_return("dg-key")
      end

      it "returns transcribed text" do
        response = {
          results: {
            channels: [{
              alternatives: [{ transcript: "Hello from Deepgram" }]
            }]
          }
        }

        stub_request(:post, %r{api\.deepgram\.com/v1/listen})
          .to_return(status: 200, body: response.to_json, headers: { "Content-Type" => "application/json" })

        result = described_class.transcribe(audio_data, provider: "deepgram")
        expect(result).to eq("Hello from Deepgram")
      end
    end

    it "raises on unsupported provider" do
      expect {
        described_class.transcribe(audio_data, provider: "unsupported")
      }.to raise_error(Voice::STTService::TranscriptionError, /Unsupported STT provider/)
    end
  end
end
