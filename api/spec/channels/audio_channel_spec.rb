# frozen_string_literal: true

require "rails_helper"

RSpec.describe AudioChannel, type: :channel do
  let(:user) { create(:user) }
  let(:chat) { create(:chat, user: user) }
  let(:voice_preset) { create(:voice_preset) }
  let(:mock_pipeline) { instance_double(Voice::Pipeline, start: nil, stop: nil, receive_audio: nil, handle_vad_event: nil) }

  before do
    stub_connection(current_user: user)
    allow(Voice::Pipeline).to receive(:new).and_return(mock_pipeline)

    stub_const("HelpDeskAgent", Class.new do
      def initialize(chat:, model: nil); end
      def ask(msg); "response"; end
    end)
  end

  describe "#subscribed" do
    it "subscribes with valid chat" do
      subscribe(chat_id: chat.id)
      expect(subscription).to be_confirmed
      expect(VoiceSession.count).to eq(1)
      expect(VoiceSession.last.chat).to eq(chat)
      expect(VoiceSession.last.user).to eq(user)
    end

    it "rejects with invalid chat" do
      subscribe(chat_id: -1)
      expect(subscription).to be_rejected
    end

    it "creates voice session with preset" do
      subscribe(chat_id: chat.id, voice_preset_id: voice_preset.id)
      expect(subscription).to be_confirmed
      expect(VoiceSession.last.voice_preset).to eq(voice_preset)
    end

    it "starts the voice pipeline" do
      expect(mock_pipeline).to receive(:start)
      subscribe(chat_id: chat.id)
    end
  end

  describe "#receive" do
    before { subscribe(chat_id: chat.id) }

    it "handles audio_chunk messages" do
      audio_b64 = Base64.strict_encode64("fake_audio")
      expect(mock_pipeline).to receive(:receive_audio)
      perform(:receive, { "type" => "audio_chunk", "audio" => audio_b64 })
    end

    it "handles vad_event messages" do
      expect(mock_pipeline).to receive(:handle_vad_event).with("speech_start")
      perform(:receive, { "type" => "vad_event", "event" => "speech_start" })
    end

    it "handles stop messages" do
      expect(mock_pipeline).to receive(:stop)
      perform(:receive, { "type" => "stop" })
    end
  end

  describe "#unsubscribed" do
    it "stops the pipeline" do
      subscribe(chat_id: chat.id)
      expect(mock_pipeline).to receive(:stop)
      unsubscribe
    end
  end
end
