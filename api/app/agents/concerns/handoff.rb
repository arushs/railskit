# frozen_string_literal: true

# Handoff enables agents to transfer a conversation to another agent mid-stream.
#
# Include this in any agent that should be able to hand off:
#
#   class TriageAgent
#     include Handoff
#
#     def initialize(conversation:)
#       @conversation = conversation
#       # ...
#     end
#
#     def process(message)
#       response = ask(message)
#       if should_escalate?(response)
#         hand_off_to(BillingAgent, reason: "User needs billing help")
#       else
#         response
#       end
#     end
#   end
#
# Handoff preserves conversation history and appends a system note so the
# receiving agent has context about why the transfer happened.
#
module Handoff
  extend ActiveSupport::Concern

  HandoffResult = Data.define(:from_agent, :to_agent, :to_instance, :reason, :conversation)

  included do
    attr_reader :handoff_result
  end

  # Transfer the conversation to another agent class.
  #
  # Options:
  #   reason:       Why the handoff is happening (appended as system message)
  #   message:      Optional message to re-send to the new agent
  #   context:      Extra kwargs passed to the new agent's constructor
  #   summarize:    If true, prepend a conversation summary for the new agent (default: false)
  #
  # Returns a HandoffResult with the new agent instance ready to go.
  def hand_off_to(agent_class, reason: nil, message: nil, context: {}, summarize: false)
    conversation = @conversation
    raise "Cannot hand off without a conversation" unless conversation

    # Log the handoff in the conversation
    handoff_note = build_handoff_note(agent_class, reason)
    conversation.persist_message(role: "system", content: handoff_note)

    # Optionally prepend a summary of the conversation so far
    if summarize
      summary = summarize_conversation(conversation)
      conversation.persist_message(role: "system", content: "Previous conversation summary: #{summary}")
    end

    # Instantiate the new agent with the same conversation
    new_agent = agent_class.new(conversation: conversation, **context)

    @handoff_result = HandoffResult.new(
      from_agent: self.class.name,
      to_agent: agent_class.name,
      to_instance: new_agent,
      reason: reason,
      conversation: conversation
    )

    # If a message was provided, immediately process it with the new agent
    if message
      response = new_agent.ask(message)
      @handoff_result = HandoffResult.new(
        from_agent: self.class.name,
        to_agent: agent_class.name,
        to_instance: new_agent,
        reason: reason,
        conversation: conversation
      )
      response
    else
      @handoff_result
    end
  end

  # Check if the last action was a handoff
  def handed_off?
    @handoff_result.present?
  end

  private

  def build_handoff_note(agent_class, reason)
    parts = ["[Handoff] Transferring from #{self.class.name} to #{agent_class.name}."]
    parts << "Reason: #{reason}" if reason
    parts.join(" ")
  end

  def summarize_conversation(conversation)
    messages = conversation.messages.where(role: %w[user assistant]).last(10)
    messages.map { |m| "#{m.role}: #{m.content&.truncate(200)}" }.join("\n")
  rescue StandardError
    "(summary unavailable)"
  end
end
