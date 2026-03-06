# frozen_string_literal: true

# Voice Agents configuration.
# Set DEEPGRAM_API_KEY and ELEVENLABS_API_KEY env vars, or use Rails credentials.

Rails.application.config.voice = ActiveSupport::OrderedOptions.new.tap do |voice|
  voice.stt_provider = ENV.fetch("VOICE_STT_PROVIDER", "deepgram").to_sym
  voice.tts_provider = ENV.fetch("VOICE_TTS_PROVIDER", "elevenlabs").to_sym
  voice.audio_format = ENV.fetch("VOICE_AUDIO_FORMAT", "pcm_16000")
  voice.vad_mode = ENV.fetch("VOICE_VAD_MODE", "client").to_sym
  voice.language = ENV.fetch("VOICE_LANGUAGE", "en")
  voice.stt_model = ENV.fetch("VOICE_STT_MODEL", "nova-2")
  voice.tts_output_format = ENV.fetch("VOICE_TTS_OUTPUT_FORMAT", "mp3_44100_128")
  voice.punctuate = ENV.fetch("VOICE_PUNCTUATE", "true") == "true"
end
