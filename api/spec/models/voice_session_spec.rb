# frozen_string_literal: true

require "rails_helper"

RSpec.describe VoiceSession, type: :model do
  let(:user) { create(:user) }
  let(:session) { create(:voice_session, user: user) }

  describe "associations" do
    it { is_expected.to belong_to(:user) }
    it { is_expected.to belong_to(:chat).optional }
  end

  describe "validations" do
    it "requires a valid status" do
      session.status = "invalid"
      expect(session).not_to be_valid
    end

    it "accepts valid statuses" do
      %w[idle listening processing speaking error].each do |status|
        session.status = status
        expect(session).to be_valid
      end
    end
  end

  describe "#transition_to!" do
    it "updates status and last_activity_at" do
      expect { session.transition_to!("processing") }
        .to change { session.reload.status }.from("idle").to("processing")
      expect(session.last_activity_at).to be_within(2.seconds).of(Time.current)
    end
  end

  describe "#increment_turn!" do
    it "increments turn_count" do
      expect { session.increment_turn! }
        .to change { session.reload.turn_count }.by(1)
    end
  end

  describe "#active?" do
    it "returns true for non-error sessions" do
      expect(session.active?).to be true
    end

    it "returns false for error sessions" do
      session.update!(status: "error")
      expect(session.active?).to be false
    end
  end

  describe "#ensure_chat!" do
    it "creates a chat when none exists" do
      expect { session.ensure_chat! }.to change(Chat, :count).by(1)
      expect(session.reload.chat).to be_present
    end

    it "returns existing chat if present" do
      chat = create(:chat, user: user)
      session.update!(chat: chat)
      expect { session.ensure_chat! }.not_to change(Chat, :count)
      expect(session.ensure_chat!).to eq(chat)
    end
  end

  describe "defaults" do
    it "assigns provider defaults from config on create" do
      new_session = create(:voice_session, user: user, stt_provider: nil, tts_provider: nil, tts_voice: nil)
      expect(new_session.stt_provider).to be_present
      expect(new_session.tts_provider).to be_present
      expect(new_session.tts_voice).to be_present
    end
  end
end
