# frozen_string_literal: true

require "rails_helper"

RSpec.describe VoiceSession, type: :model do
  describe "validations" do
    it { is_expected.to validate_presence_of(:status) }
    it { is_expected.to validate_inclusion_of(:status).in_array(%w[active paused ended error]) }
    it { is_expected.to validate_presence_of(:started_at) }
    it { is_expected.to validate_presence_of(:audio_format) }
  end

  describe "associations" do
    it { is_expected.to belong_to(:chat) }
    it { is_expected.to belong_to(:user) }
    it { is_expected.to belong_to(:voice_preset).optional }
    it { is_expected.to have_many(:audio_segments).dependent(:destroy) }
  end

  describe "scopes" do
    let(:user) { create(:user) }
    let!(:active_session) { create(:voice_session, user: user) }
    let!(:ended_session) { create(:voice_session, :ended, user: user) }

    it "filters active sessions" do
      expect(VoiceSession.active).to include(active_session)
      expect(VoiceSession.active).not_to include(ended_session)
    end

    it "filters ended sessions" do
      expect(VoiceSession.ended).to include(ended_session)
      expect(VoiceSession.ended).not_to include(active_session)
    end

    it "filters by user" do
      other_user = create(:user)
      create(:voice_session, user: other_user)
      expect(VoiceSession.for_user(user)).to contain_exactly(active_session, ended_session)
    end
  end

  describe "#end_session!" do
    it "ends the session with timestamp and duration" do
      session = create(:voice_session)
      travel_to(5.minutes.from_now) { session.end_session! }

      expect(session.status).to eq("ended")
      expect(session.ended_at).to be_present
      expect(session.duration).to be > 0
    end
  end

  describe "#active?" do
    it "returns true for active sessions" do
      expect(build(:voice_session, status: "active")).to be_active
    end

    it "returns false for ended sessions" do
      expect(build(:voice_session, status: "ended")).not_to be_active
    end
  end

  describe "callbacks" do
    it "sets started_at on create if not provided" do
      session = create(:voice_session, started_at: nil)
      expect(session.started_at).to be_present
    end
  end
end
