# frozen_string_literal: true

module Api
  class TeamInvitationsController < ApplicationController
    before_action :authenticate_user!, except: [:accept]
    include TeamAuthorizable

    before_action :authorize_team_admin!, only: %i[index create destroy]

    def index
      invitations = current_team.team_invitations.pending.includes(:invited_by)
      render json: invitations.map { |inv| invitation_json(inv) }
    end

    def create
      invitation = current_team.team_invitations.new(
        email: params[:email],
        role: params[:role] || "member",
        invited_by: current_user
      )

      if invitation.save
        # TODO: Send invitation email via ActionMailer
        render json: invitation_json(invitation), status: :created
      else
        render json: { errors: invitation.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def destroy
      invitation = current_team.team_invitations.find(params[:id])
      invitation.destroy!
      render json: { message: "Invitation cancelled" }
    end

    def accept
      invitation = TeamInvitation.find_by!(token: params[:token])

      if invitation.expired?
        render json: { error: "This invitation has expired" }, status: :gone
        return
      end

      if invitation.accepted?
        render json: { error: "This invitation has already been accepted" }, status: :conflict
        return
      end

      # If user is logged in, accept directly. Otherwise return invitation info.
      if current_user
        invitation.accept!(current_user)
        render json: { message: "Welcome to #{invitation.team.name}!", team: { id: invitation.team.id, slug: invitation.team.slug } }
      else
        render json: {
          invitation: {
            team_name: invitation.team.name,
            email: invitation.email,
            role: invitation.role,
            invited_by: invitation.invited_by.name
          }
        }
      end
    rescue ActiveRecord::RecordNotFound
      render json: { error: "Invalid invitation" }, status: :not_found
    end

    private

    def invitation_json(invitation)
      {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        invited_by: {
          id: invitation.invited_by.id,
          name: invitation.invited_by.name
        },
        expires_at: invitation.expires_at,
        created_at: invitation.created_at
      }
    end
  end
end
