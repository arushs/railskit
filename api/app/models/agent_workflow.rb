# frozen_string_literal: true

class AgentWorkflow < ApplicationRecord
  has_many :workflow_runs, dependent: :destroy

  validates :name, presence: true, uniqueness: true
  validates :coordinator_agent, presence: true
end
