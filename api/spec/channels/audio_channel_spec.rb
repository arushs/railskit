# frozen_string_literal: true

require "rails_helper"

RSpec.describe AudioChannel, type: :channel do
  let(:user) { create(:user) }
  let(:session) { create(:voice_session, user: user) }

  before do
    stub_connection(current_user: user)
  end

  describe "#subscribed" do
    it "subscribes with valid voice_session_id" do
      subscribe(voice_session_id: session.id)
      expect(subscription).to be_confirmed
    end

    it "rejects with invalid session id" do
      subscribe(voice_session_id: -1)
      expect(subscription).to be_rejected
    end

    it "rejects when session belongs to another user" do
      other = create(:user)
      other_session = create(:voice_session, user: other)
      subscribe(voice_session_id: other_session.id)
      expect(subscription).to be_rejected
    end
  end

  describe "#send_text" do
    before { subscribe(voice_session_id: session.id) }

    it "enqueues ProcessTextJob" do
      expect(Voice::ProcessTextJob).to receive(:perform_later)
        .with(hash_including(voice_session_id: session.id, text: "Hello"))

      perform :send_text, { "text" => "Hello" }
    end

    it "ignores blank text" do
      expect(Voice::ProcessTextJob).not_to receive(:perform_later)
      perform :send_text, { "text" => "" }
    end
  end

  describe "#send_audio" do
    before { subscribe(voice_session_id: session.id) }

    it "enqueues ProcessAudioJob" do
      expect(Voice::ProcessAudioJob).to receive(:perform_later)
        .with(hash_including(voice_session_id: session.id))

      perform :send_audio, { "data" => Base64.strict_encode64("audio-bytes"), "format" => "webm" }
    end
  end

  describe "#interrupt" do
    before { subscribe(voice_session_id: session.id) }

    it "transitions session to idle" do
      session.update!(status: "speaking")
      perform :interrupt
      expect(session.reload.status).to eq("idle")
    end
  end

  describe "#update_config" do
    before { subscribe(voice_session_id: session.id) }

    it "updates session config" do
      perform :update_config, { "tts_voice" => "nova", "language" => "es" }
      session.reload
      expect(session.tts_voice).to eq("nova")
      expect(session.language).to eq("es")
    end
  end

  describe "#unsubscribed" do
    it "resets session to idle" do
      subscribe(voice_session_id: session.id)
      session.update!(status: "speaking")
      unsubscribe
      expect(session.reload.status).to eq("idle")
    end
  end
end
