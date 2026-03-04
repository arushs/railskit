# frozen_string_literal: true

class ToolGenerator < Rails::Generators::NamedBase
  source_root File.expand_path("templates", __dir__)

  def create_tool_class
    template "tool.rb.tt", File.join("app/tools", "#{file_name}_tool.rb")
  end

  def create_test_file
    template "tool_test.rb.tt", File.join("test/tools", "#{file_name}_tool_test.rb")
  end

  def show_instructions
    say ""
    say "Tool '#{class_name}Tool' created!", :green
    say "  api/app/tools/#{file_name}_tool.rb"
    say "  api/test/tools/#{file_name}_tool_test.rb"
  end
end
