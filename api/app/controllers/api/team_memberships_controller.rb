# frozen_string_literal: true

module Api
  class TeamMembershipsController < ApplicationController
    before_action :authenticate_user!
    include TeamAuthorizable

    before_action :authorize_team_member!, only: [:index]
    before_action :authorize_team_admin!, only: %i[update destroy]

    def index
      memberships = current_team.team_memberships.includes(:user)
      render json: memberships.map { |m| membership_json(m) }
    end

    def update
      membership = current_team.team_memberships.find(params[:id])

      if membership.owner?
        render json: { error: "Cannot change owner role" }, status: :unprocessable_entity
        return
      end

      if membership.update(role: params[:role])
        render json: membership_json(membership)
      else
        render json: { errors: membership.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def destroy
      membership = current_team.team_memberships.find(params[:id])

      if membership.owner?
        render json: { error: "Cannot remove team owner" }, status: :unprocessable_entity
        return
      end

      membership.destroy!
      render json: { message: "Member removed" }
    end

    private

    def membership_json(membership)
      {
        id: membership.id,
        user: {
          id: membership.user.id,
          name: membership.user.name,
          email: membership.user.email,
          avatar_url: membership.user.avatar_url
        },
        role: membership.role,
        joined_at: membership.created_at
      }
    end
  end
end
