# frozen_string_literal: true

require "rails_helper"

RSpec.describe Voice::Pipeline do
  let(:user) { create(:user) }
  let(:session) { create(:voice_session, user: user) }
  let(:pipeline) { described_class.new(session) }
  let(:events) { [] }
  let(:broadcast) { ->(event) { events << event } }

  describe "#process_audio" do
    let(:audio_data) { "fake-audio-bytes" }
    let(:mock_chat) { create(:chat, user: user) }
    let(:mock_response) do
      double(
        content: "I can help with that!",
        model_id: "gpt-4o",
        input_tokens: 10,
        output_tokens: 20
      )
    end

    before do
      allow(Voice::STTService).to receive(:transcribe).and_return("Hello")
      allow(Voice::TTSService).to receive(:stream).and_yield("audio-chunk")
      allow(session).to receive(:ensure_chat!).and_return(mock_chat)
      allow(mock_chat).to receive(:persist_message)
      allow(mock_chat).to receive(:to_llm_chat).and_return(double(ask: mock_response))
    end

    it "processes through full pipeline" do
      pipeline.process_audio(audio_data, format: "webm", &broadcast)

      types = events.map { |e| e[:type] }
      expect(types).to include("status", "transcript", "audio", "audio_end", "turn_complete")
    end

    it "transitions through correct states" do
      pipeline.process_audio(audio_data, &broadcast)
      expect(session.reload.status).to eq("idle")
      expect(session.turn_count).to eq(1)
    end

    it "handles blank transcription" do
      allow(Voice::STTService).to receive(:transcribe).and_return("")

      pipeline.process_audio(audio_data, &broadcast)
      statuses = events.select { |e| e[:type] == "status" }.map { |e| e[:status] }
      expect(statuses).to include("no_speech")
    end

    it "handles STT errors" do
      allow(Voice::STTService).to receive(:transcribe)
        .and_raise(Voice::STTService::TranscriptionError, "Failed")

      pipeline.process_audio(audio_data, &broadcast)
      error = events.find { |e| e[:type] == "error" }
      expect(error[:stage]).to eq("transcription")
    end

    it "handles TTS errors" do
      allow(Voice::TTSService).to receive(:stream)
        .and_raise(Voice::TTSService::SynthesisError, "Failed")

      pipeline.process_audio(audio_data, &broadcast)
      error = events.find { |e| e[:type] == "error" }
      expect(error[:stage]).to eq("synthesis")
    end
  end

  describe "#process_text" do
    let(:mock_chat) { create(:chat, user: user) }
    let(:mock_response) do
      double(content: "Response", model_id: "gpt-4o", input_tokens: 5, output_tokens: 10)
    end

    before do
      allow(Voice::TTSService).to receive(:stream).and_yield("audio-chunk")
      allow(session).to receive(:ensure_chat!).and_return(mock_chat)
      allow(mock_chat).to receive(:persist_message)
      allow(mock_chat).to receive(:to_llm_chat).and_return(double(ask: mock_response))
    end

    it "skips STT and processes text directly" do
      pipeline.process_text("Hello", &broadcast)

      types = events.map { |e| e[:type] }
      expect(types).to include("transcript", "audio", "turn_complete")
      expect(types).not_to include("no_speech")
    end
  end
end
