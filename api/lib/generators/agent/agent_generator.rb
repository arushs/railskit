# frozen_string_literal: true

class AgentGenerator < Rails::Generators::NamedBase
  source_root File.expand_path("templates", __dir__)

  def create_agent_class
    template "agent.rb.tt", File.join("app/agents", "#{file_name}_agent.rb")
  end

  def create_react_component
    template "chat_component.tsx.tt",
             File.join("..", "web", "src", "components", "agents", "#{class_name}Chat.tsx")
  end

  def create_test_file
    template "agent_test.rb.tt", File.join("test/agents", "#{file_name}_agent_test.rb")
  end

  def show_instructions
    say ""
    say "Agent '#{class_name}Agent' created!", :green
    say "  api/app/agents/#{file_name}_agent.rb"
    say "  web/src/components/agents/#{class_name}Chat.tsx"
    say "  api/test/agents/#{file_name}_agent_test.rb"
  end
end
