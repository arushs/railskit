# frozen_string_literal: true

class AgentInvocation < ApplicationRecord
  ROLES = %w[coordinator specialist delegate].freeze
  STATUSES = %w[pending running completed failed].freeze

  belongs_to :workflow_run
  belongs_to :parent_invocation, class_name: "AgentInvocation", optional: true
  has_many :child_invocations, class_name: "AgentInvocation", foreign_key: :parent_invocation_id, dependent: :nullify

  validates :agent_name, presence: true
  validates :role, presence: true, inclusion: { in: ROLES }
  validates :status, presence: true, inclusion: { in: STATUSES }

  scope :roots, -> { where(parent_invocation_id: nil) }

  def running!
    update!(status: "running", started_at: Time.current)
  end

  def complete!(output = {})
    update!(status: "completed", output: output, completed_at: Time.current)
  end

  def fail!(output = {})
    update!(status: "failed", output: output, completed_at: Time.current)
  end

  # Build the full invocation chain from this node down
  def chain
    [self] + child_invocations.flat_map(&:chain)
  end
end
