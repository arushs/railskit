# frozen_string_literal: true

module Api
  class TeamsController < ApplicationController
    before_action :authenticate_user!
    include TeamAuthorizable

    before_action :authorize_team_member!, only: [:show]
    before_action :authorize_team_admin!, only: [:update]
    before_action :authorize_team_owner!, only: [:destroy]

    def index
      teams = current_user.teams.includes(:owner)
      render json: teams.map { |t| team_json(t) }
    end

    def show
      render json: team_json(current_team, include_members: true)
    end

    def create
      team = Team.new(team_params.merge(owner: current_user))

      if team.save
        team.add_member!(current_user, role: "owner")
        current_user.update!(current_team_id: team.id) if current_user.current_team_id.nil?
        render json: team_json(team), status: :created
      else
        render json: { errors: team.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def update
      if current_team.update(team_params)
        render json: team_json(current_team)
      else
        render json: { errors: current_team.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def destroy
      if current_team.personal?
        render json: { error: "Cannot delete personal team" }, status: :unprocessable_entity
        return
      end

      current_team.destroy!
      render json: { message: "Team deleted" }
    end

    private

    def team_params
      params.require(:team).permit(:name)
    end

    def team_json(team, include_members: false)
      json = {
        id: team.id,
        name: team.name,
        slug: team.slug,
        personal: team.personal,
        owner: { id: team.owner.id, name: team.owner.name, email: team.owner.email },
        members_count: team.team_memberships.count,
        created_at: team.created_at,
        current_user_role: team.role_for(current_user)
      }

      if include_members
        json[:members] = team.team_memberships.includes(:user).map do |m|
          {
            id: m.id,
            user: { id: m.user.id, name: m.user.name, email: m.user.email, avatar_url: m.user.avatar_url },
            role: m.role,
            joined_at: m.created_at
          }
        end
        json[:invitations] = team.team_invitations.pending.map do |inv|
          {
            id: inv.id,
            email: inv.email,
            role: inv.role,
            invited_by: inv.invited_by.name,
            expires_at: inv.expires_at,
            created_at: inv.created_at
          }
        end
      end

      json
    end
  end
end
