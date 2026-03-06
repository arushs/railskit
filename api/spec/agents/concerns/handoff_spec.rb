# frozen_string_literal: true

require "rails_helper"

RSpec.describe Handoff do
  # Stub conversation with in-memory messages
  let(:messages) { [] }
  let(:conversation) do
    conv = double("conversation")
    allow(conv).to receive(:persist_message) do |role:, content:, **|
      messages << { role: role, content: content }
    end
    allow(conv).to receive(:messages).and_return(
      double(where: double(last: []), "last" => [])
    )
    conv
  end

  let(:target_agent_class) do
    Class.new do
      include Handoff
      def self.name = "TargetAgent"
      attr_reader :conversation

      def initialize(conversation: nil, **)
        @conversation = conversation
      end

      def ask(message)
        OpenStruct.new(content: "target: #{message}")
      end
    end
  end

  let(:source_agent_class) do
    target_cls = target_agent_class # capture for closure
    Class.new do
      include Handoff
      def self.name = "SourceAgent"
      attr_reader :conversation

      define_method(:initialize) do |conversation: nil, **_|
        @conversation = conversation
        @target_class = target_cls
      end

      define_method(:do_handoff) do |reason: nil, message: nil|
        hand_off_to(@target_class, reason: reason, message: message)
      end
    end
  end

  describe "#hand_off_to" do
    let(:source) { source_agent_class.new(conversation: conversation) }

    it "logs a handoff system message" do
      source.do_handoff(reason: "needs billing help")
      expect(messages.last[:role]).to eq("system")
      expect(messages.last[:content]).to include("[Handoff]")
      expect(messages.last[:content]).to include("TargetAgent")
      expect(messages.last[:content]).to include("needs billing help")
    end

    it "returns a HandoffResult without a message" do
      result = source.do_handoff(reason: "escalation")
      expect(result).to be_a(Handoff::HandoffResult)
      expect(result.from_agent).to eq("SourceAgent")
      expect(result.to_agent).to eq("TargetAgent")
      expect(result.to_instance).to be_a(target_agent_class)
    end

    it "immediately processes a message when provided" do
      response = source.do_handoff(reason: "escalation", message: "help me")
      expect(response.content).to eq("target: help me")
    end

    it "sets handed_off? to true" do
      expect(source.handed_off?).to be false
      source.do_handoff
      expect(source.handed_off?).to be true
    end
  end
end
