# frozen_string_literal: true

class SharedContext < ApplicationRecord
  belongs_to :workflow_run

  validates :key, presence: true, uniqueness: { scope: :workflow_run_id }

  # Read a value from the shared context for a given workflow run
  def self.read(key, workflow_run:)
    find_by(workflow_run: workflow_run, key: key)&.value
  end

  # Write a value to the shared context (upsert)
  def self.write(key, value, workflow_run:, writer: nil)
    record = find_or_initialize_by(workflow_run: workflow_run, key: key)
    record.update!(value: value, written_by: writer)
    record
  end

  # Merge a hash of key-value pairs into the shared context
  def self.merge(hash, workflow_run:, writer: nil)
    hash.each do |key, value|
      write(key.to_s, value, workflow_run: workflow_run, writer: writer)
    end
  end

  # Get all context as a hash for a workflow run
  def self.to_h(workflow_run:)
    where(workflow_run: workflow_run).each_with_object({}) do |ctx, hash|
      hash[ctx.key] = ctx.value
    end
  end
end
