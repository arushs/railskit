# frozen_string_literal: true

require "rails_helper"
require "railskit/voice_enabled"

RSpec.describe RailsKit::VoiceEnabled do
  let(:test_class) do
    Class.new do
      include ActiveSupport::Concern
      include RailsKit::VoiceEnabled

      voice_preset :Rachel
      voice_response_mode :concise

      def instructions
        "You are a helpful assistant."
      end
    end
  end

  let(:standard_class) do
    Class.new do
      include ActiveSupport::Concern
      include RailsKit::VoiceEnabled
      voice_response_mode :standard
    end
  end

  let(:bare_class) do
    Class.new do
      include ActiveSupport::Concern
      include RailsKit::VoiceEnabled
    end
  end

  describe ".voice_preset" do
    it "sets the voice preset name" do
      expect(test_class._voice_preset_name).to eq("Rachel")
    end
  end

  describe ".voice_response_mode" do
    it "sets concise mode" do
      expect(test_class._voice_response_mode).to eq(:concise)
    end

    it "sets standard mode" do
      expect(standard_class._voice_response_mode).to eq(:standard)
    end
  end

  describe "#voice_enabled?" do
    it "returns true when preset is configured" do
      expect(test_class.new).to be_voice_enabled
    end

    it "returns false when no preset" do
      expect(bare_class.new).not_to be_voice_enabled
    end
  end

  describe "#voice_preset_record" do
    it "finds the voice preset by name" do
      preset = create(:voice_preset, name: "Rachel")
      expect(test_class.new.voice_preset_record).to eq(preset)
    end

    it "returns nil when preset not found" do
      expect(test_class.new.voice_preset_record).to be_nil
    end
  end

  describe "#voice_instructions" do
    it "appends concise voice prompt" do
      agent = test_class.new
      instructions = agent.voice_instructions
      expect(instructions).to include("You are a helpful assistant")
      expect(instructions).to include("VOICE MODE ACTIVE")
      expect(instructions).to include("1-3 sentences")
    end

    it "returns base instructions in standard mode" do
      agent = standard_class.new
      allow(agent).to receive(:instructions).and_return("Base instructions")
      expect(agent.voice_instructions).to eq("Base instructions")
    end
  end
end
