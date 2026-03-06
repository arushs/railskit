# frozen_string_literal: true

class AudioChannel < ApplicationCable::Channel
  # Bidirectional audio streaming over ActionCable for voice conversations.

  def subscribed
    @chat = current_user.chats.find_by(id: params[:chat_id])
    reject and return unless @chat

    voice_preset = params[:voice_preset_id] ? VoicePreset.find_by(id: params[:voice_preset_id]) : nil
    @voice_session = VoiceSession.create!(
      chat: @chat,
      user: current_user,
      voice_preset: voice_preset,
      audio_format: params[:audio_format] || "pcm_16000"
    )

    agent_name = params[:agent_name] || @chat.agent_class || "help_desk"
    agent_class = "#{agent_name.classify}Agent".constantize
    @agent = agent_class.new(chat: @chat)

    @pipeline = Voice::Pipeline.new(
      voice_session: @voice_session,
      agent: @agent,
      broadcast_to: method(:broadcast_to_user)
    )
    @pipeline.start

    stream_for current_user
  rescue StandardError => e
    Rails.logger.error("[AudioChannel] Subscription failed: #{e.message}")
    reject
  end

  def unsubscribed
    stop_pipeline
    stop_all_streams
  end

  def receive(data)
    case data["type"]
    when "audio_chunk"
      audio_bytes = Base64.decode64(data["audio"]) if data["audio"]
      @pipeline&.receive_audio(audio_bytes) if audio_bytes
    when "vad_event"
      @pipeline&.handle_vad_event(data["event"])
    when "stop"
      stop_pipeline
    end
  rescue StandardError => e
    Rails.logger.error("[AudioChannel] Error: #{e.message}")
    broadcast_to_user({ type: "pipeline_error", error: "An error occurred", session_id: @voice_session&.id })
  end

  private

  def stop_pipeline
    @pipeline&.stop
    @pipeline = nil
  end

  def broadcast_to_user(data)
    AudioChannel.broadcast_to(current_user, data)
  end
end
