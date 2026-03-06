# frozen_string_literal: true

require "rails_helper"

RSpec.describe AudioSegment, type: :model do
  describe "validations" do
    it { is_expected.to validate_presence_of(:content) }
    it { is_expected.to validate_presence_of(:speaker) }
    it { is_expected.to validate_inclusion_of(:speaker).in_array(%w[user agent]) }
  end

  describe "associations" do
    it { is_expected.to belong_to(:voice_session) }
  end

  describe "scopes" do
    let(:session) { create(:voice_session) }
    let!(:user_segment) { create(:audio_segment, voice_session: session, speaker: "user") }
    let!(:agent_segment) { create(:audio_segment, :agent, voice_session: session) }

    it "filters by speaker" do
      expect(AudioSegment.by_speaker("user")).to include(user_segment)
      expect(AudioSegment.by_speaker("user")).not_to include(agent_segment)
    end

    it "orders by sequence number" do
      expect(AudioSegment.ordered.pluck(:sequence_number)).to eq([1, 2])
    end
  end

  describe "callbacks" do
    it "auto-assigns sequence number" do
      session = create(:voice_session)
      seg1 = create(:audio_segment, voice_session: session)
      seg2 = create(:audio_segment, voice_session: session)
      expect(seg1.sequence_number).to eq(1)
      expect(seg2.sequence_number).to eq(2)
    end
  end
end
