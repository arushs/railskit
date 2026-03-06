# frozen_string_literal: true

require "rails_helper"

RSpec.describe Voice::DeepgramStt do
  let(:transcript_callback) { double("callback") }
  let(:error_callback) { double("error_callback") }

  subject do
    described_class.new(on_transcript: transcript_callback, on_error: error_callback, api_key: "test_key")
  end

  describe "#initialize" do
    it "defaults to not connected" do
      expect(subject).not_to be_connected
    end
  end

  describe "#start" do
    it "raises without API key" do
      client = described_class.new(on_transcript: transcript_callback, api_key: nil)
      allow(Rails.application.credentials).to receive(:dig).and_return(nil)
      allow(ENV).to receive(:[]).with("DEEPGRAM_API_KEY").and_return(nil)
      expect { client.start }.to raise_error("Deepgram API key not configured")
    end
  end

  describe "#send_audio" do
    it "does nothing when not connected" do
      expect { subject.send_audio("audio_data") }.not_to raise_error
    end
  end

  describe "#stop" do
    it "handles stop when not started" do
      expect { subject.stop }.not_to raise_error
      expect(subject).not_to be_connected
    end
  end

  describe "message handling" do
    it "parses final transcript results" do
      data = { "type" => "Results", "is_final" => true,
               "channel" => { "alternatives" => [{ "transcript" => "Hello world" }] } }.to_json
      expect(transcript_callback).to receive(:call).with("Hello world", is_final: true)
      subject.send(:handle_message, data)
    end

    it "parses interim transcript results" do
      data = { "type" => "Results", "is_final" => false,
               "channel" => { "alternatives" => [{ "transcript" => "Hel" }] } }.to_json
      expect(transcript_callback).to receive(:call).with("Hel", is_final: false)
      subject.send(:handle_message, data)
    end

    it "skips empty transcripts" do
      data = { "type" => "Results", "is_final" => true,
               "channel" => { "alternatives" => [{ "transcript" => "" }] } }.to_json
      expect(transcript_callback).not_to receive(:call)
      subject.send(:handle_message, data)
    end

    it "handles error messages" do
      data = { "type" => "Error", "description" => "Something went wrong" }.to_json
      expect(error_callback).to receive(:call).with(instance_of(StandardError))
      subject.send(:handle_message, data)
    end

    it "handles invalid JSON gracefully" do
      expect { subject.send(:handle_message, "not json") }.not_to raise_error
    end
  end

  describe "URL building" do
    it "includes configured parameters" do
      url = subject.send(:build_url)
      expect(url).to include("wss://api.deepgram.com/v1/listen")
      expect(url).to include("model=nova-2")
      expect(url).to include("language=en")
      expect(url).to include("punctuate=true")
    end

    it "uses custom options" do
      client = described_class.new(on_transcript: transcript_callback, api_key: "k", language: "es", model: "nova-3")
      url = client.send(:build_url)
      expect(url).to include("language=es")
      expect(url).to include("model=nova-3")
    end
  end
end
