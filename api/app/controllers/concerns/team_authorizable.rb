# frozen_string_literal: true

module TeamAuthorizable
  extend ActiveSupport::Concern

  private

  def current_team
    @current_team ||= current_user.teams.find(params[:team_id] || params[:id])
  end

  def current_membership
    @current_membership ||= current_team.team_memberships.find_by!(user: current_user)
  end

  def authorize_team_member!
    current_membership
  rescue ActiveRecord::RecordNotFound
    render json: { error: "You are not a member of this team" }, status: :forbidden
  end

  def authorize_team_admin!
    unless current_membership.admin_or_above?
      render json: { error: "Admin access required" }, status: :forbidden
    end
  rescue ActiveRecord::RecordNotFound
    render json: { error: "You are not a member of this team" }, status: :forbidden
  end

  def authorize_team_owner!
    unless current_membership.owner?
      render json: { error: "Owner access required" }, status: :forbidden
    end
  rescue ActiveRecord::RecordNotFound
    render json: { error: "You are not a member of this team" }, status: :forbidden
  end
end
