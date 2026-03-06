# frozen_string_literal: true

require "rails_helper"

RSpec.describe Voice::WhisperStt do
  let(:transcript_callback) { double("callback") }
  let(:error_callback) { double("error_callback") }

  subject do
    described_class.new(on_transcript: transcript_callback, on_error: error_callback, binary: "/usr/local/bin/whisper", model: "base", language: "en")
  end

  describe "#initialize" do
    it "defaults to not connected" do
      expect(subject).not_to be_connected
    end
  end

  describe "#start" do
    it "sets connected state" do
      subject.start
      expect(subject).to be_connected
    end

    it "raises when whisper binary not found" do
      client = described_class.new(on_transcript: transcript_callback)
      client.instance_variable_set(:@whisper_binary, nil)
      expect { client.start }.to raise_error(/Whisper binary not found/)
    end
  end

  describe "#send_audio" do
    it "buffers audio data" do
      subject.start
      subject.send_audio("audio_chunk")
      expect(subject.instance_variable_get(:@buffer)).to eq("audio_chunk")
    end

    it "does nothing when not connected" do
      subject.send_audio("audio_data")
      expect(subject.instance_variable_get(:@buffer)).to eq("")
    end
  end

  describe "#stop" do
    it "sets disconnected state" do
      subject.start
      allow(subject).to receive(:process_buffer)
      subject.stop
      expect(subject).not_to be_connected
    end
  end

  describe "WAV writing" do
    it "writes valid WAV header" do
      file = Tempfile.new(["test", ".wav"])
      subject.send(:write_wav, file, "\x00\x01" * 100)
      file.close
      content = File.binread(file.path)
      expect(content[0..3]).to eq("RIFF")
      expect(content[8..11]).to eq("WAVE")
      file.unlink
    end
  end

  describe "command building" do
    it "builds whisper command with options" do
      cmd = subject.send(:build_command, "/tmp/test.wav")
      expect(cmd).to include("/usr/local/bin/whisper")
      expect(cmd).to include("--model base")
      expect(cmd).to include("--language en")
    end
  end

  describe "output parsing" do
    it "strips timestamps" do
      output = "[00:00.000 --> 00:02.000] Hello world\nHow are you?"
      result = subject.send(:parse_output, output)
      expect(result).to include("How are you?")
      expect(result).not_to include("[00:00")
    end
  end
end
