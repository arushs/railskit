# frozen_string_literal: true

# Rails generator for the Document Intelligence pipeline.
#
# Usage:
#   rails generate document_pipeline
#
# Creates:
#   - ProcessedDocument model and migration
#   - Document pipeline initializer with default categories and extraction schemas
#
class DocumentPipelineGenerator < Rails::Generators::Base
  source_root File.expand_path("templates", __dir__)

  desc "Generates the Document Intelligence pipeline with ProcessedDocument model and initializer"

  def create_migration
    timestamp = Time.now.utc.strftime("%Y%m%d%H%M%S")
    template "migration.rb.tt", "db/migrate/#{timestamp}_create_processed_documents.rb"
  end

  def create_model
    template "processed_document.rb.tt", "app/models/processed_document.rb"
  end

  def create_initializer
    template "initializer.rb.tt", "config/initializers/document_pipeline.rb"
  end

  def create_job
    template "process_document_intelligence_job.rb.tt", "app/jobs/process_document_intelligence_job.rb"
  end

  def display_post_install
    say ""
    say "Document Intelligence pipeline installed!", :green
    say ""
    say "Next steps:"
    say "  1. Run migrations:  rails db:migrate"
    say "  2. Configure categories in config/initializers/document_pipeline.rb"
    say "  3. Add extraction schemas per category"
    say "  4. Process documents:"
    say ""
    say "     # In a controller or job:"
    say "     config = Rails.application.config.document_pipeline"
    say "     result = DocumentPipeline.new(config).process(file_path: 'doc.pdf')"
    say ""
    say "     # Or use individual agents:"
    say "     parser = DocumentParserAgent.new"
    say "     result = parser.parse(raw_text: 'Some document text...')"
    say ""
  end
end
