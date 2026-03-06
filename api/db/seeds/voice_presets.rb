# frozen_string_literal: true

# Seed popular ElevenLabs voices.
# Run: rails db:seed or rails runner db/seeds/voice_presets.rb

VOICE_PRESETS = [
  { name: "Rachel", voice_id: "21m00Tcm4TlvDq8ikWAM", default: true },
  { name: "Adam", voice_id: "pNInz6obpgDQGcFmaJgB" },
  { name: "Domi", voice_id: "AZnzlk1XvdvUeBnXmlld" },
  { name: "Bella", voice_id: "EXAVITQu4vr4xnSDxMaL" },
  { name: "Antoni", voice_id: "ErXwobaYiN019PkySvjV" },
  { name: "Elli", voice_id: "MF3mGyEYCl7XYWbV9V6O" },
  { name: "Josh", voice_id: "TxGEqnHWrfWFTfGW9XjX" },
  { name: "Sam", voice_id: "yoZ06aMxZJJ28mfd3POQ" }
].freeze

VOICE_PRESETS.each do |attrs|
  VoicePreset.find_or_create_by!(name: attrs[:name]) do |preset|
    preset.provider = "elevenlabs"
    preset.voice_id = attrs[:voice_id]
    preset.settings = { "stability" => 0.5, "similarity_boost" => 0.75, "style" => 0.0 }
    preset.default = attrs.fetch(:default, false)
  end
end

puts "Seeded #{VOICE_PRESETS.size} voice presets"
