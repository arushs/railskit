# frozen_string_literal: true

require "rails_helper"

RSpec.describe AsTool do
  let(:agent_class) do
    Class.new do
      include AsTool

      tool_name "test_agent"
      tool_description "A test agent for specs"
      tool_param :message, type: :string, desc: "The message", required: true

      def self.name = "TestAgent"

      def initialize(conversation: nil, **_)
        @conversation = conversation
      end

      def ask(message)
        OpenStruct.new(content: "echo: #{message}")
      end
    end
  end

  describe ".tool_name" do
    it "returns the declared tool name" do
      expect(agent_class.tool_name).to eq("test_agent")
    end
  end

  describe ".tool_description" do
    it "returns the declared description" do
      expect(agent_class.tool_description).to eq("A test agent for specs")
    end
  end

  describe ".to_tool" do
    it "returns a RubyLLM::Tool subclass" do
      tool_class = agent_class.to_tool
      expect(tool_class).to be < RubyLLM::Tool
    end

    it "the tool executes the agent and returns a hash" do
      tool_class = agent_class.to_tool
      tool = tool_class.new
      result = tool.execute(message: "hello")
      expect(result[:agent]).to eq("test_agent")
      expect(result[:response]).to eq("echo: hello")
    end
  end

  describe "defaults" do
    let(:bare_class) do
      Class.new do
        include AsTool
        def self.name = "BareAgent"
        def initialize(**) = nil
        def ask(msg) = OpenStruct.new(content: msg)
      end
    end

    it "defaults tool_name to underscored class name" do
      expect(bare_class.tool_name).to eq("bare_agent")
    end

    it "defaults description" do
      expect(bare_class.tool_description).to include("BareAgent")
    end
  end
end
