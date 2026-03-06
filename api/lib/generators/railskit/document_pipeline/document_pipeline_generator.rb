# frozen_string_literal: true

module Railskit
  module Generators
    class DocumentPipelineGenerator < Rails::Generators::Base
      source_root File.expand_path("templates", __dir__)

      desc "Generate a document intelligence pipeline with ProcessedDocument model, agents, and configuration"

      def create_migration
        timestamp = Time.now.utc.strftime("%Y%m%d%H%M%S")
        template "migration.rb.tt",
          File.join("db/migrate", "#{timestamp}_create_processed_documents.rb")
      end

      def create_model
        template "processed_document.rb.tt", "app/models/processed_document.rb"
      end

      def copy_agents
        %w[
          document_parser_agent.rb
          document_classifier_agent.rb
          document_extractor_agent.rb
        ].each do |agent_file|
          source = File.expand_path("../../../../app/agents/#{agent_file}", __dir__)
          dest = File.join("app/agents", agent_file)
          copy_file(source, dest) unless File.exist?(dest)
        end
      end

      def copy_pipeline_service
        source = File.expand_path("../../../../app/services/document_pipeline.rb", __dir__)
        dest = "app/services/document_pipeline.rb"
        copy_file(source, dest) unless File.exist?(dest)
      end

      def create_initializer
        template "initializer.rb.tt", "config/initializers/document_pipeline.rb"
      end

      def show_post_install
        say ""
        say "Document Pipeline installed!", :green
        say ""
        say "Next steps:"
        say "  1. Run migrations:  rails db:migrate"
        say "  2. Edit config/initializers/document_pipeline.rb with your categories"
        say "  3. Process a document:"
        say ""
        say "     result = DocumentPipeline.new(DOCUMENT_PIPELINE_CONFIG).process(file_path: 'doc.pdf')"
        say ""
      end
    end
  end
end
