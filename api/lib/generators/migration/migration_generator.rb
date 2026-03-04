# frozen_string_literal: true

# Adapter-aware migration generator.
#
# Usage:
#   rails generate migration CreateProducts name:string price:decimal
#
# Behaviour depends on the configured database adapter:
#   - postgresql: generates a standard ActiveRecord migration
#   - supabase:   generates a raw SQL migration file for the Supabase SQL editor / CLI
#   - convex:     generates a Convex schema stub (TypeScript)
#
class MigrationGenerator < Rails::Generators::NamedBase
  include Rails::Generators::Migration

  source_root File.expand_path("templates", __dir__)

  argument :attributes, type: :array, default: [], banner: "field:type field:type"

  class_option :adapter, type: :string, default: nil,
    desc: "Override the database adapter (postgresql, supabase, convex)"

  def self.next_migration_number(dirname)
    Time.now.utc.strftime("%Y%m%d%H%M%S")
  end

  def create_migration_file
    case resolved_adapter
    when "postgresql"
      migration_template "active_record_migration.rb.tt",
        File.join("db/migrate", "#{file_name}.rb")
    when "supabase"
      template "supabase_migration.sql.tt",
        File.join("db/supabase_migrations", "#{timestamp}_#{file_name}.sql")
    when "convex"
      template "convex_schema_stub.ts.tt",
        File.join("db/convex_schemas", "#{file_name}.ts")
    else
      raise "Unknown adapter: #{resolved_adapter}"
    end
  end

  private

  def resolved_adapter
    options[:adapter] || railskit_adapter
  end

  def railskit_adapter
    require_relative "../../../config/initializers/railskit"
    RailsKit.config.database.adapter
  rescue StandardError
    "postgresql"
  end

  def table_name
    file_name.sub(/^create_/, "")
  end

  def timestamp
    Time.now.utc.strftime("%Y%m%d%H%M%S")
  end

  def columns_for_migration
    attributes.map do |attr|
      name, type = attr.split(":")
      { name: name, type: type || "string" }
    end
  end

  # Map Rails types to PostgreSQL types for Supabase raw SQL migrations.
  def sql_type_for(type)
    {
      "string"     => "text",
      "text"       => "text",
      "integer"    => "integer",
      "bigint"     => "bigint",
      "float"      => "double precision",
      "decimal"    => "numeric",
      "boolean"    => "boolean",
      "date"       => "date",
      "datetime"   => "timestamptz",
      "timestamp"  => "timestamptz",
      "json"       => "jsonb",
      "jsonb"      => "jsonb",
      "uuid"       => "uuid",
      "references" => "bigint"
    }.fetch(type.to_s, "text")
  end

  # Map Rails types to Convex value validators.
  def convex_type_for(type)
    {
      "string"    => "string",
      "text"      => "string",
      "integer"   => "number",
      "bigint"    => "number",
      "float"     => "number",
      "decimal"   => "number",
      "boolean"   => "boolean",
      "date"      => "string",
      "datetime"  => "number",
      "timestamp" => "number",
      "json"      => "any",
      "jsonb"     => "any",
      "uuid"      => "string"
    }.fetch(type.to_s, "string")
  end
end
