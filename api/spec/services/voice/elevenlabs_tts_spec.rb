# frozen_string_literal: true

require "rails_helper"

RSpec.describe Voice::ElevenlabsTts do
  let(:voice_preset) do
    build(:voice_preset, voice_id: "test_voice_id", settings: { "stability" => 0.5, "similarity_boost" => 0.75 })
  end

  subject { described_class.new(api_key: "test_key") }

  describe "#initialize" do
    it "starts not cancelled" do
      expect(subject).not_to be_cancelled
    end
  end

  describe "#synthesize" do
    it "raises without API key" do
      client = described_class.new(api_key: nil)
      allow(Rails.application.credentials).to receive(:dig).and_return(nil)
      allow(ENV).to receive(:[]).with("ELEVENLABS_API_KEY").and_return(nil)
      expect { client.synthesize("hello", voice_preset: voice_preset) { |_| } }.to raise_error("ElevenLabs API key not configured")
    end

    it "requires a block" do
      expect { subject.synthesize("hello", voice_preset: voice_preset) }.to raise_error(ArgumentError)
    end

    it "makes HTTP request to ElevenLabs API" do
      stub_request(:post, "https://api.elevenlabs.io/v1/text-to-speech/test_voice_id/stream?output_format=mp3_44100_128")
        .to_return(status: 200, body: "fake_audio", headers: { "Content-Type" => "audio/mpeg" })

      chunks = []
      subject.synthesize("Hello", voice_preset: voice_preset) { |c| chunks << c }
      expect(chunks.join).to eq("fake_audio")
    end
  end

  describe "#synthesize_full" do
    it "returns complete audio buffer" do
      stub_request(:post, /api\.elevenlabs\.io/).to_return(status: 200, body: "full_audio")
      result = subject.synthesize_full("Hello", voice_preset: voice_preset)
      expect(result).to eq("full_audio")
    end
  end

  describe "#cancel!" do
    it "sets cancelled flag" do
      subject.cancel!
      expect(subject).to be_cancelled
    end
  end
end
