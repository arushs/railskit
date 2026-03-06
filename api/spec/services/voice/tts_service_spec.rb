# frozen_string_literal: true

require "rails_helper"

RSpec.describe Voice::TTSService do
  before do
    allow(ENV).to receive(:fetch).with("OPENAI_API_KEY").and_return("test-key")
    allow(ENV).to receive(:fetch).with("OPENAI_BASE_URL", anything).and_return("https://api.openai.com/v1")
  end

  describe ".synthesize" do
    context "with openai provider" do
      it "returns audio bytes" do
        audio_bytes = "\xFF\xFB\x90\x00" * 100 # fake mp3 data

        stub_request(:post, "https://api.openai.com/v1/audio/speech")
          .to_return(status: 200, body: audio_bytes, headers: { "Content-Type" => "audio/mpeg" })

        result = described_class.synthesize("Hello", provider: "openai", voice: "alloy")
        expect(result).to eq(audio_bytes)
      end

      it "raises SynthesisError on API failure" do
        stub_request(:post, "https://api.openai.com/v1/audio/speech")
          .to_return(status: 429, body: "Rate limited")

        expect {
          described_class.synthesize("Hello", provider: "openai")
        }.to raise_error(Voice::TTSService::SynthesisError, /OpenAI TTS error: 429/)
      end
    end

    context "with elevenlabs provider" do
      before do
        allow(ENV).to receive(:fetch).with("ELEVENLABS_API_KEY").and_return("el-key")
      end

      it "returns audio bytes" do
        audio_bytes = "\xFF\xFB\x90\x00" * 100

        stub_request(:post, %r{api\.elevenlabs\.io/v1/text-to-speech/})
          .to_return(status: 200, body: audio_bytes, headers: { "Content-Type" => "audio/mpeg" })

        result = described_class.synthesize("Hello", provider: "elevenlabs", voice: "test-voice-id")
        expect(result).to eq(audio_bytes)
      end
    end

    it "raises on unsupported provider" do
      expect {
        described_class.synthesize("Hello", provider: "unsupported")
      }.to raise_error(Voice::TTSService::SynthesisError, /Unsupported TTS provider/)
    end
  end

  describe ".stream" do
    it "yields audio chunks" do
      audio_chunk = "\xFF\xFB\x90\x00" * 50

      stub_request(:post, "https://api.openai.com/v1/audio/speech")
        .to_return(status: 200, body: audio_chunk, headers: { "Content-Type" => "audio/mpeg" })

      chunks = []
      described_class.stream("Hello", provider: "openai", voice: "alloy") do |chunk|
        chunks << chunk
      end

      expect(chunks).not_to be_empty
      expect(chunks.join).to eq(audio_chunk)
    end
  end
end
