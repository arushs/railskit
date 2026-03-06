# frozen_string_literal: true

module Api
  class VoiceSessionsController < ApplicationController
    before_action :authenticate_user!
    before_action :set_voice_session, only: %i[show destroy]

    # GET /api/voice_sessions
    def index
      sessions = current_user.voice_sessions.order(updated_at: :desc).limit(20)

      render json: sessions.map { |s| session_json(s) }
    end

    # GET /api/voice_sessions/:id
    def show
      render json: session_json(@voice_session).merge(
        chat_id: @voice_session.chat_id,
        transcript: @voice_session.chat&.messages&.chronological&.map { |m|
          { role: m.role, content: m.content, created_at: m.created_at.iso8601 }
        }
      )
    end

    # POST /api/voice_sessions
    def create
      session = current_user.voice_sessions.build(voice_session_params)

      if session.save
        render json: session_json(session), status: :created
      else
        render json: { errors: session.errors.full_messages }, status: :unprocessable_entity
      end
    end

    # DELETE /api/voice_sessions/:id
    def destroy
      @voice_session.destroy
      head :no_content
    end

    private

    def set_voice_session
      @voice_session = current_user.voice_sessions.find(params[:id])
    end

    def voice_session_params
      params.permit(:agent_class, :tts_voice, :tts_provider, :stt_provider, :language)
    end

    def session_json(session)
      {
        id: session.id,
        status: session.status,
        agent_class: session.agent_class,
        stt_provider: session.stt_provider,
        tts_provider: session.tts_provider,
        tts_voice: session.tts_voice,
        language: session.language,
        turn_count: session.turn_count,
        last_activity_at: session.last_activity_at&.iso8601,
        created_at: session.created_at.iso8601
      }
    end
  end
end
