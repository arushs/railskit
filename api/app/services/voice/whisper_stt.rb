# frozen_string_literal: true

require "tempfile"
require "open3"

module Voice
  # Local Speech-to-Text using OpenAI Whisper as fallback when no Deepgram API key.
  # Processes buffered audio chunks (not real-time streaming).
  class WhisperStt < SttBase
    BUFFER_DURATION_SECONDS = 3
    SAMPLE_RATE = 16_000
    BYTES_PER_SAMPLE = 2

    def initialize(on_transcript:, on_error: nil, **options)
      super
      @buffer = +""
      @connected = false
      @processing = false
      @whisper_binary = options[:binary] || find_whisper_binary
      @model = options.fetch(:model, "base")
      @language = options.fetch(:language, "en")
    end

    def start
      raise "Whisper binary not found. Install whisper.cpp or whisper CLI." unless @whisper_binary
      @connected = true
      @buffer = +""
      Rails.logger.info("[WhisperStt] Started with model=#{@model}")
    end

    def send_audio(audio_data)
      return unless connected?
      @buffer << audio_data
      buffer_duration = @buffer.bytesize.to_f / (SAMPLE_RATE * BYTES_PER_SAMPLE)
      process_buffer if buffer_duration >= BUFFER_DURATION_SECONDS
    end

    def stop
      process_buffer if @buffer.bytesize > 0
      @connected = false
    end

    def connected?
      @connected
    end

    private

    def process_buffer
      return if @processing || @buffer.empty?
      @processing = true
      audio_data = @buffer.dup
      @buffer = +""

      Thread.new do
        transcribe(audio_data)
      ensure
        @processing = false
      end
    end

    def transcribe(audio_data)
      wav_file = Tempfile.new(["whisper_input", ".wav"])
      write_wav(wav_file, audio_data)
      wav_file.close

      cmd = build_command(wav_file.path)
      stdout, stderr, status = Open3.capture3(cmd)

      if status.success?
        transcript = parse_output(stdout).strip
        on_transcript.call(transcript, is_final: true) if transcript.present?
      else
        on_error.call(StandardError.new("Whisper failed: #{stderr}"))
      end
    rescue StandardError => e
      on_error.call(e)
    ensure
      wav_file&.unlink
    end

    def build_command(file_path)
      [@whisper_binary, "--model", @model, "--language", @language, "--output-txt", "--no-timestamps", file_path].join(" ")
    end

    def parse_output(stdout)
      stdout.lines.reject { |l| l.start_with?("[") }.join(" ").gsub(/\s+/, " ")
    end

    def write_wav(file, pcm_data)
      data_size = pcm_data.bytesize
      file.binmode
      file.write("RIFF")
      file.write([36 + data_size].pack("V"))
      file.write("WAVEfmt ")
      file.write([16].pack("V"))
      file.write([1].pack("v"))
      file.write([1].pack("v"))
      file.write([SAMPLE_RATE].pack("V"))
      file.write([SAMPLE_RATE * BYTES_PER_SAMPLE].pack("V"))
      file.write([BYTES_PER_SAMPLE].pack("v"))
      file.write([16].pack("v"))
      file.write("data")
      file.write([data_size].pack("V"))
      file.write(pcm_data)
    end

    def find_whisper_binary
      %w[whisper whisper-cpp whisper.cpp main].each do |name|
        path = `which #{name} 2>/dev/null`.strip
        return path if path.present? && File.executable?(path)
      end
      nil
    end
  end
end
