# frozen_string_literal: true

require "rails_helper"

RSpec.describe Voice::Pipeline do
  let(:user) { create(:user) }
  let(:chat) { create(:chat, user: user) }
  let(:voice_preset) { create(:voice_preset, :default) }
  let(:voice_session) { create(:voice_session, chat: chat, user: user, voice_preset: voice_preset) }
  let(:broadcasts) { [] }
  let(:broadcast_proc) { ->(data) { broadcasts << data } }
  let(:mock_agent) { double("agent") }
  let(:mock_stt) { instance_double(Voice::DeepgramStt, start: nil, stop: nil, connected?: true, send_audio: nil) }
  let(:mock_tts) { instance_double(Voice::ElevenlabsTts, cancel!: nil) }

  subject do
    described_class.new(voice_session: voice_session, agent: mock_agent, broadcast_to: broadcast_proc)
  end

  before do
    allow(Voice::DeepgramStt).to receive(:new).and_return(mock_stt)
    allow(Voice::ElevenlabsTts).to receive(:new).and_return(mock_tts)
  end

  describe "#start" do
    it "starts STT and broadcasts pipeline_ready" do
      expect(mock_stt).to receive(:start)
      subject.start
      expect(broadcasts.last[:type]).to eq("pipeline_ready")
      expect(broadcasts.last[:session_id]).to eq(voice_session.id)
    end
  end

  describe "#receive_audio" do
    it "forwards audio to STT" do
      subject.start
      expect(mock_stt).to receive(:send_audio).with("audio_bytes")
      subject.receive_audio("audio_bytes")
    end

    it "does nothing when STT not connected" do
      allow(mock_stt).to receive(:connected?).and_return(false)
      subject.start
      expect(mock_stt).not_to receive(:send_audio)
      subject.receive_audio("audio_bytes")
    end
  end

  describe "#stop" do
    it "stops STT/TTS and ends session" do
      subject.start
      expect(mock_stt).to receive(:stop)
      expect(mock_tts).to receive(:cancel!)
      subject.stop

      voice_session.reload
      expect(voice_session.status).to eq("ended")
      expect(broadcasts.last[:type]).to eq("pipeline_stopped")
    end
  end

  describe "#interrupt!" do
    it "cancels TTS and broadcasts" do
      subject.start
      expect(mock_tts).to receive(:cancel!)
      subject.interrupt!
      expect(broadcasts.last[:type]).to eq("tts_interrupted")
    end
  end

  describe "transcript processing" do
    it "broadcasts interim transcripts" do
      subject.start
      subject.send(:on_transcript, "Hel", is_final: false)
      expect(broadcasts.last[:type]).to eq("transcript_interim")
      expect(broadcasts.last[:text]).to eq("Hel")
    end

    it "broadcasts final transcripts" do
      subject.start
      subject.send(:on_transcript, "Hello world", is_final: true)
      expect(broadcasts.any? { |b| b[:type] == "transcript_final" }).to be true
    end
  end
end
