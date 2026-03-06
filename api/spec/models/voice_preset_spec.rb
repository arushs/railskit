# frozen_string_literal: true

require "rails_helper"

RSpec.describe VoicePreset, type: :model do
  describe "validations" do
    subject { build(:voice_preset) }

    it { is_expected.to validate_presence_of(:name) }
    it { is_expected.to validate_uniqueness_of(:name) }
    it { is_expected.to validate_presence_of(:provider) }
    it { is_expected.to validate_inclusion_of(:provider).in_array(%w[elevenlabs]) }
    it { is_expected.to validate_presence_of(:voice_id) }
  end

  describe "associations" do
    it { is_expected.to have_many(:voice_sessions).dependent(:nullify) }
  end

  describe "scopes" do
    let!(:default_preset) { create(:voice_preset, :default) }
    let!(:regular_preset) { create(:voice_preset) }

    it "filters defaults" do
      expect(VoicePreset.defaults).to include(default_preset)
      expect(VoicePreset.defaults).not_to include(regular_preset)
    end

    it "filters by provider" do
      expect(VoicePreset.by_provider("elevenlabs")).to include(default_preset, regular_preset)
      expect(VoicePreset.by_provider("other")).to be_empty
    end
  end

  describe "#settings_with_defaults" do
    it "merges custom settings over defaults" do
      preset = build(:voice_preset, settings: { "stability" => 0.8 })
      result = preset.settings_with_defaults
      expect(result["stability"]).to eq(0.8)
      expect(result["similarity_boost"]).to eq(0.75)
      expect(result["style"]).to eq(0.0)
    end

    it "returns defaults when no custom settings" do
      preset = build(:voice_preset, settings: {})
      result = preset.settings_with_defaults
      expect(result["stability"]).to eq(0.5)
    end
  end
end
