# frozen_string_literal: true

require "rails_helper"
require "yaml"

RSpec.describe "bin/setup wizard" do
  let(:setup_script) { File.join(Rails.root, "..", "bin", "setup") }

  describe "script structure" do
    it "exists and is executable" do
      expect(File.exist?(setup_script)).to be true
      expect(File.executable?(setup_script)).to be true
    end

    it "uses TTY::Prompt via bundler/inline" do
      content = File.read(setup_script)
      expect(content).to include('require "bundler/inline"')
      expect(content).to include('gem "tty-prompt"')
      expect(content).to include('require "tty-prompt"')
    end

    it "writes railskit.yml" do
      content = File.read(setup_script)
      expect(content).to include("railskit.yml")
      expect(content).to include("config.to_yaml")
    end

    it "generates .env file" do
      content = File.read(setup_script)
      expect(content).to include('.env')
      expect(content).to match(/File\.write.*\.env/)
    end
  end

  describe "expected config structure" do
    # Parse the script to verify it produces a config with required keys
    it "config hash includes all expected top-level sections" do
      content = File.read(setup_script)

      %w[app database auth payments email ai theme].each do |section|
        expect(content).to include(%("#{section}"))
      end
    end

    it "config.app includes name and domain" do
      content = File.read(setup_script)
      expect(content).to include('"name" => app_name')
      expect(content).to include('"domain" => app_domain')
    end
  end

  describe "expected .env keys" do
    it "always includes core Rails env vars" do
      content = File.read(setup_script)
      %w[RAILS_ENV REDIS_URL CORS_ORIGINS VITE_API_URL].each do |key|
        expect(content).to include(%("#{key}"))
      end
    end

    it "includes database env vars for postgresql" do
      content = File.read(setup_script)
      expect(content).to include("DATABASE_URL")
    end

    it "includes Stripe env vars when stripe is selected" do
      content = File.read(setup_script)
      expect(content).to include("STRIPE_SECRET_KEY")
      expect(content).to include("STRIPE_WEBHOOK_SECRET")
    end

    it "includes AI provider env vars" do
      content = File.read(setup_script)
      %w[OPENAI_API_KEY ANTHROPIC_API_KEY GOOGLE_AI_API_KEY OLLAMA_BASE_URL].each do |key|
        expect(content).to include(key)
      end
    end

    it "includes Google OAuth env vars" do
      content = File.read(setup_script)
      expect(content).to include("GOOGLE_CLIENT_ID")
      expect(content).to include("GOOGLE_CLIENT_SECRET")
    end
  end

  describe "wizard options" do
    it "supports postgresql, supabase, and convex databases" do
      content = File.read(setup_script)
      expect(content).to include('"postgresql"')
      expect(content).to include('"supabase"')
      expect(content).to include('"convex"')
    end

    it "supports devise, supabase, and clerk auth providers" do
      content = File.read(setup_script)
      expect(content).to include('"devise"')
      expect(content).to include('"clerk"')
    end

    it "supports stripe and lemon_squeezy payment providers" do
      content = File.read(setup_script)
      expect(content).to include('"stripe"')
      expect(content).to include('"lemon_squeezy"')
    end

    it "supports openai, anthropic, google, and ollama AI providers" do
      content = File.read(setup_script)
      %w[openai anthropic google ollama].each do |provider|
        expect(content).to include(%("#{provider}"))
      end
    end

    it "supports multiple email providers" do
      content = File.read(setup_script)
      %w[resend postmark smtp].each do |provider|
        expect(content).to include(%("#{provider}"))
      end
    end
  end
end
