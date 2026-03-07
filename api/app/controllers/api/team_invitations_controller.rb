# frozen_string_literal: true

module Api
  class TeamInvitationsController < ApplicationController
    before_action :authenticate_user!, except: [:accept]
    before_action :set_team, only: %i[index create destroy]
    before_action :authorize_admin!, only: %i[create destroy]

    # GET /api/teams/:team_id/invitations
    def index
      invitations = @team.team_invitations.pending.includes(:inviter).order(created_at: :desc)

      render json: invitations.map { |i|
        {
          id: i.id,
          email: i.email,
          role: i.role,
          token: i.token,
          inviter: { id: i.inviter.id, name: i.inviter.name, email: i.inviter.email },
          expires_at: i.expires_at.iso8601,
          created_at: i.created_at.iso8601
        }
      }
    end

    # POST /api/teams/:team_id/invitations
    def create
      invitation = @team.team_invitations.build(invitation_params)
      invitation.inviter = current_user

      if invitation.save
        render json: {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          token: invitation.token,
          expires_at: invitation.expires_at.iso8601,
          created_at: invitation.created_at.iso8601
        }, status: :created
      else
        render json: { errors: invitation.errors.full_messages }, status: :unprocessable_entity
      end
    end

    # DELETE /api/teams/:team_id/invitations/:id
    def destroy
      invitation = @team.team_invitations.find(params[:id])
      invitation.destroy
      head :no_content
    end

    # POST /api/invitations/:token/accept
    def accept
      invitation = TeamInvitation.pending.find_by!(token: params[:token])

      if invitation.expired?
        return render json: { error: "Invitation has expired" }, status: :gone
      end

      # Require authentication for accepting
      authenticate_user!
      return unless current_user

      team = invitation.team

      if team.memberships.exists?(user: current_user)
        return render json: { error: "Already a member of this team" }, status: :unprocessable_entity
      end

      team.memberships.create!(user: current_user, role: invitation.role)
      invitation.update!(accepted_at: Time.current)

      render json: {
        team: { id: team.id, name: team.name, slug: team.slug },
        message: "Invitation accepted"
      }
    end

    private

    def set_team
      @team = current_user.teams.find(params[:team_id])
      @current_membership = current_user.memberships.find_by!(team: @team)
    end

    def invitation_params
      params.permit(:email, :role)
    end

    def authorize_admin!
      return if @current_membership.admin? || @current_membership.owner?

      render json: { error: "Forbidden" }, status: :forbidden
    end
  end
end
