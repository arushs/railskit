# frozen_string_literal: true

require "rails_helper"

RSpec.describe Voice::TTSService do
  describe ".synthesize" do
    context "with OpenAI provider" do
      before { ENV["OPENAI_API_KEY"] = "test-key" }

      it "returns audio bytes" do
        fake_audio = "\xFF\xFB\x90\x00" # fake MP3 header
        stub_request(:post, "https://api.openai.com/v1/audio/speech")
          .to_return(status: 200, body: fake_audio)

        result = described_class.synthesize("Hello!", provider: "openai", voice: "alloy")
        expect(result).to eq(fake_audio)
      end

      it "raises on API error" do
        stub_request(:post, "https://api.openai.com/v1/audio/speech")
          .to_return(status: 500, body: "error")

        expect {
          described_class.synthesize("Hello!", provider: "openai")
        }.to raise_error(Voice::TTSService::SynthesisError)
      end
    end

    context "with ElevenLabs provider" do
      before { ENV["ELEVENLABS_API_KEY"] = "test-key" }

      it "returns audio bytes" do
        fake_audio = "\xFF\xFB\x90\x00"
        stub_request(:post, /api\.elevenlabs\.io/)
          .to_return(status: 200, body: fake_audio)

        result = described_class.synthesize("Hello!", provider: "elevenlabs", voice: "Rachel")
        expect(result).to eq(fake_audio)
      end
    end

    it "raises on unsupported provider" do
      expect {
        described_class.synthesize("Hello!", provider: "invalid")
      }.to raise_error(Voice::TTSService::SynthesisError, /Unsupported/)
    end
  end
end
