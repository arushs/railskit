# frozen_string_literal: true

module Api
  class TeamsController < ApplicationController
    before_action :authenticate_user!
    before_action :set_team, only: %i[show update destroy]
    before_action :authorize_admin!, only: %i[update]
    before_action :authorize_owner!, only: %i[destroy]

    # GET /api/teams
    def index
      teams = current_user.teams.includes(:memberships).order(created_at: :desc)

      render json: teams.map { |t|
        {
          id: t.id,
          name: t.name,
          slug: t.slug,
          personal: t.personal,
          owner_id: t.owner_id,
          member_count: t.memberships.size,
          role: t.memberships.find { |m| m.user_id == current_user.id }&.role,
          created_at: t.created_at.iso8601,
          updated_at: t.updated_at.iso8601
        }
      }
    end

    # GET /api/teams/:id
    def show
      render json: {
        id: @team.id,
        name: @team.name,
        slug: @team.slug,
        personal: @team.personal,
        owner_id: @team.owner_id,
        member_count: @team.memberships.size,
        role: @membership.role,
        created_at: @team.created_at.iso8601,
        updated_at: @team.updated_at.iso8601
      }
    end

    # POST /api/teams
    def create
      team = Team.new(team_params)
      team.owner = current_user

      if team.save
        team.memberships.create!(user: current_user, role: :owner)
        render json: { id: team.id, name: team.name, slug: team.slug }, status: :created
      else
        render json: { errors: team.errors.full_messages }, status: :unprocessable_entity
      end
    end

    # PATCH /api/teams/:id
    def update
      if @team.update(team_params)
        render json: { id: @team.id, name: @team.name, slug: @team.slug }
      else
        render json: { errors: @team.errors.full_messages }, status: :unprocessable_entity
      end
    end

    # DELETE /api/teams/:id
    def destroy
      @team.destroy
      head :no_content
    end

    private

    def set_team
      @team = current_user.teams.find(params[:id])
      @membership = current_user.memberships.find_by!(team: @team)
    end

    def team_params
      params.permit(:name)
    end

    def authorize_admin!
      return if @membership.admin? || @membership.owner?

      render json: { error: "Forbidden" }, status: :forbidden
    end

    def authorize_owner!
      return if @membership.owner?

      render json: { error: "Forbidden" }, status: :forbidden
    end
  end
end
