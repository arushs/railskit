# frozen_string_literal: true

module Api
  class MembershipsController < ApplicationController
    before_action :authenticate_user!
    before_action :set_team
    before_action :authorize_admin!, only: %i[update destroy]

    # GET /api/teams/:team_id/memberships
    def index
      memberships = @team.memberships.includes(:user).order(created_at: :asc)

      render json: memberships.map { |m|
        {
          id: m.id,
          user_id: m.user_id,
          role: m.role,
          user: {
            id: m.user.id,
            name: m.user.name,
            email: m.user.email,
            avatar_url: m.user.avatar_url
          },
          created_at: m.created_at.iso8601
        }
      }
    end

    # PATCH /api/teams/:team_id/memberships/:id
    def update
      membership = @team.memberships.find(params[:id])

      if membership.owner?
        return render json: { error: "Cannot change owner role" }, status: :forbidden
      end

      if membership.update(role: params[:role])
        render json: { id: membership.id, role: membership.role }
      else
        render json: { errors: membership.errors.full_messages }, status: :unprocessable_entity
      end
    end

    # DELETE /api/teams/:team_id/memberships/:id
    def destroy
      membership = @team.memberships.find(params[:id])

      if membership.owner?
        return render json: { error: "Cannot remove owner" }, status: :forbidden
      end

      membership.destroy
      head :no_content
    end

    private

    def set_team
      @team = current_user.teams.find(params[:team_id])
      @current_membership = current_user.memberships.find_by!(team: @team)
    end

    def authorize_admin!
      return if @current_membership.admin? || @current_membership.owner?

      render json: { error: "Forbidden" }, status: :forbidden
    end
  end
end
