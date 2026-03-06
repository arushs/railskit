# frozen_string_literal: true

class WorkflowRun < ApplicationRecord
  STATUSES = %w[pending running completed failed].freeze

  belongs_to :agent_workflow
  has_many :agent_invocations, dependent: :destroy
  has_many :shared_contexts, dependent: :destroy

  validates :status, presence: true, inclusion: { in: STATUSES }

  scope :active, -> { where(status: %w[pending running]) }
  scope :completed, -> { where(status: "completed") }
  scope :failed, -> { where(status: "failed") }

  def running!
    update!(status: "running", started_at: Time.current)
  end

  def complete!(output = {})
    update!(status: "completed", output: output, completed_at: Time.current)
  end

  def fail!(output = {})
    update!(status: "failed", output: output, completed_at: Time.current)
  end
end
