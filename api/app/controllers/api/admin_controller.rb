# frozen_string_literal: true

module Api
  class AdminController < ApplicationController
    before_action :authenticate_user!
    before_action :require_admin!

    # GET /api/admin/stats
    def stats
      render json: {
        users: {
          total: User.count,
          this_month: User.where("created_at >= ?", Time.current.beginning_of_month).count,
          by_plan: User.group(:plan).count,
          admins: User.where(admin: true).count,
        },
        teams: {
          total: Team.count,
          this_month: Team.where("created_at >= ?", Time.current.beginning_of_month).count,
        },
        chats: {
          total: Chat.count,
          this_month: Chat.where("created_at >= ?", Time.current.beginning_of_month).count,
        },
      }
    end

    # GET /api/admin/users
    def users
      page = (params[:page] || 1).to_i
      per = (params[:per] || 25).to_i.clamp(1, 100)
      offset = (page - 1) * per

      scope = User.order(created_at: :desc)
      scope = scope.where("email ILIKE ? OR name ILIKE ?", "%#{params[:q]}%", "%#{params[:q]}%") if params[:q].present?

      total = scope.count
      users = scope.limit(per).offset(offset)

      render json: {
        users: users.map { |u| user_json(u) },
        total: total,
        page: page,
        per: per,
        pages: (total.to_f / per).ceil,
      }
    end

    # PATCH /api/admin/users/:id
    def update_user
      user = User.find(params[:id])

      # Prevent removing own admin
      if user == current_user && params[:admin] == false
        return render json: { error: "Cannot remove your own admin access" }, status: :forbidden
      end

      allowed = {}
      allowed[:plan] = params[:plan] if params[:plan].present?
      allowed[:admin] = params[:admin] unless params[:admin].nil?

      if user.update(allowed)
        render json: user_json(user)
      else
        render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
      end
    end

    # DELETE /api/admin/users/:id
    def destroy_user
      user = User.find(params[:id])

      if user == current_user
        return render json: { error: "Cannot delete yourself" }, status: :forbidden
      end

      user.destroy
      head :no_content
    end

    # GET /api/admin/teams
    def teams
      page = (params[:page] || 1).to_i
      per = (params[:per] || 25).to_i.clamp(1, 100)
      offset = (page - 1) * per

      scope = Team.includes(:owner, :memberships).order(created_at: :desc)
      scope = scope.where("name ILIKE ?", "%#{params[:q]}%") if params[:q].present?

      total = scope.count
      teams = scope.limit(per).offset(offset)

      render json: {
        teams: teams.map { |t|
          {
            id: t.id,
            name: t.name,
            slug: t.slug,
            personal: t.personal,
            owner: { id: t.owner.id, name: t.owner.name, email: t.owner.email },
            member_count: t.memberships.size,
            created_at: t.created_at.iso8601,
          }
        },
        total: total,
        page: page,
        per: per,
        pages: (total.to_f / per).ceil,
      }
    end

    # GET /api/admin/queues
    def queues
      jobs = SolidQueue::Job.order(created_at: :desc).limit(50)

      render json: {
        summary: {
          total: SolidQueue::Job.count,
          ready: SolidQueue::ReadyExecution.count,
          scheduled: SolidQueue::ScheduledExecution.count,
          failed: SolidQueue::FailedExecution.count,
        },
        recent_jobs: jobs.map { |j|
          {
            id: j.id,
            class_name: j.class_name,
            queue_name: j.queue_name,
            created_at: j.created_at.iso8601,
            finished_at: j.finished_at&.iso8601,
          }
        },
      }
    end

    private

    def require_admin!
      return if current_user&.admin?

      render json: { error: "Forbidden — admin access required" }, status: :forbidden
    end

    def user_json(user)
      {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url,
        plan: user.plan,
        admin: user.admin,
        sign_in_count: user.sign_in_count,
        last_sign_in_at: user.last_sign_in_at&.iso8601,
        created_at: user.created_at.iso8601,
      }
    end
  end
end
