# frozen_string_literal: true

module Api
  class VoicePresetsController < ApplicationController
    before_action :authenticate_user!
    before_action :set_voice_preset, only: [:show, :update, :destroy]

    def index
      presets = VoicePreset.all.order(:name)
      render json: presets.map { |p| serialize(p) }
    end

    def show
      render json: serialize(@voice_preset)
    end

    def create
      preset = VoicePreset.new(voice_preset_params)
      if preset.save
        render json: serialize(preset), status: :created
      else
        render json: { errors: preset.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def update
      if @voice_preset.update(voice_preset_params)
        render json: serialize(@voice_preset)
      else
        render json: { errors: @voice_preset.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def destroy
      @voice_preset.destroy!
      head :no_content
    end

    private

    def set_voice_preset
      @voice_preset = VoicePreset.find(params[:id])
    end

    def voice_preset_params
      params.require(:voice_preset).permit(:name, :provider, :voice_id, :default, settings: {})
    end

    def serialize(preset)
      {
        id: preset.id,
        name: preset.name,
        provider: preset.provider,
        voice_id: preset.voice_id,
        settings: preset.settings_with_defaults,
        default: preset.default,
        created_at: preset.created_at,
        updated_at: preset.updated_at
      }
    end
  end
end
