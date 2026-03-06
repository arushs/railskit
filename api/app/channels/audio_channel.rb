# frozen_string_literal: true

# AudioChannel handles real-time voice communication via ActionCable WebSocket.
#
# Client subscribes with { voice_session_id: <id> }
# Client sends audio via #send_audio action (Base64-encoded)
# Server broadcasts back: transcripts, audio chunks, status updates
#
# Protocol:
#   Client → Server:
#     { action: "send_audio", data: "<base64>", format: "webm" }
#     { action: "send_text", text: "Hello" }
#     { action: "interrupt" }
#     { action: "update_config", tts_voice: "nova", language: "es" }
#
#   Server → Client:
#     { type: "status", status: "transcribing|thinking|speaking|idle|error" }
#     { type: "transcript", role: "user|assistant", content: "..." }
#     { type: "chunk", content: "..." }        # streaming LLM text
#     { type: "audio", data: "<base64>", format: "mp3", index: 0 }
#     { type: "audio_end" }
#     { type: "turn_complete", turn: 1 }
#     { type: "error", stage: "...", message: "..." }
#
class AudioChannel < ApplicationCable::Channel
  def subscribed
    @voice_session = current_user.voice_sessions.find_by(id: params[:voice_session_id])

    if @voice_session
      stream_for @voice_session
      @pipeline = Voice::Pipeline.new(@voice_session)

      AudioChannel.broadcast_to(@voice_session, {
        type: "connected",
        voice_session_id: @voice_session.id,
        config: {
          stt_provider: @voice_session.stt_provider,
          tts_provider: @voice_session.tts_provider,
          tts_voice: @voice_session.tts_voice,
          language: @voice_session.language
        }
      })
    else
      reject
    end
  end

  def unsubscribed
    stop_all_streams
    @voice_session&.transition_to!("idle")
  end

  # Receive audio data from client for STT → LLM → TTS pipeline
  def send_audio(data)
    return unless @voice_session && @pipeline

    audio_data = Base64.decode64(data["data"])
    format = data.fetch("format", "webm")

    # Process in background to avoid blocking the channel
    Voice::ProcessAudioJob.perform_later(
      voice_session_id: @voice_session.id,
      audio_data: Base64.strict_encode64(audio_data),
      format: format
    )
  end

  # Send text directly (skip STT, useful for testing or accessibility)
  def send_text(data)
    return unless @voice_session && @pipeline

    text = data["text"]
    return unless text.present?

    Voice::ProcessTextJob.perform_later(
      voice_session_id: @voice_session.id,
      text: text
    )
  end

  # Interrupt current speech/processing
  def interrupt(_data = nil)
    return unless @voice_session

    @voice_session.transition_to!("idle")
    AudioChannel.broadcast_to(@voice_session, {
      type: "interrupted",
      voice_session_id: @voice_session.id
    })
  end

  # Update voice session config mid-conversation
  def update_config(data)
    return unless @voice_session

    updates = data.slice("tts_voice", "tts_provider", "stt_provider", "language")
    @voice_session.update!(updates) if updates.any?

    AudioChannel.broadcast_to(@voice_session, {
      type: "config_updated",
      config: updates
    })
  end
end
