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
        teams: teams.map { |t| team_json(t) },
        total: total,
        page: page,
        per: per,
        pages: (total.to_f / per).ceil,
      }
    end

    # DELETE /api/admin/teams/:id
    def destroy_team
      team = Team.find(params[:id])
      team.destroy
      head :no_content
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
        recent_jobs: jobs.map { |j| job_json(j) },
      }
    end

    # POST /api/admin/queues/:id/retry
    def retry_job
      failed = SolidQueue::FailedExecution.find_by!(job_id: params[:id])
      failed.retry
      head :no_content
    end

    # POST /api/admin/queues/:id/discard
    def discard_job
      failed = SolidQueue::FailedExecution.find_by!(job_id: params[:id])
      failed.discard
      head :no_content
    end

    # POST /api/admin/queues/bulk_retry
    def bulk_retry
      ids = Array(params[:job_ids]).map(&:to_i)
      SolidQueue::FailedExecution.where(job_id: ids).each(&:retry)
      render json: { retried: ids.size }
    end

    # POST /api/admin/queues/bulk_discard
    def bulk_discard
      ids = Array(params[:job_ids]).map(&:to_i)
      SolidQueue::FailedExecution.where(job_id: ids).each(&:discard)
      render json: { discarded: ids.size }
    end

    # GET /api/admin/pghero
    def pghero
      render json: {
        database_size: PgHero.database_size,
        running_queries: PgHero.running_queries.map { |q|
          {
            pid: q[:pid],
            duration_ms: q[:duration_ms]&.round(1),
            query: q[:query]&.truncate(200),
            state: q[:state],
            source: q[:source],
          }
        },
        long_running_queries: PgHero.long_running_queries.map { |q|
          {
            pid: q[:pid],
            duration_ms: q[:duration_ms]&.round(1),
            query: q[:query]&.truncate(200),
          }
        },
        index_usage: PgHero.index_usage.first(20).map { |idx|
          {
            table: idx[:table],
            index_usage: idx[:index_usage],
            rows: idx[:estimated_rows],
          }
        },
        unused_indexes: PgHero.unused_indexes.first(20).map { |idx|
          {
            table: idx[:table],
            index: idx[:index],
            index_size: idx[:index_size],
          }
        },
        missing_indexes: PgHero.missing_indexes.first(10).map { |idx|
          {
            table: idx[:table],
            columns: idx[:columns],
            estimated_rows: idx[:estimated_rows],
          }
        },
        duplicate_indexes: PgHero.duplicate_indexes.first(10).map { |dup|
          {
            table: dup[:table],
            indexes: dup[:indexes],
          }
        },
        table_stats: PgHero.table_stats.first(20).map { |t|
          {
            table: t[:table],
            estimated_rows: t[:estimated_rows],
            size: t[:size],
          }
        },
        cache_hit_rate: PgHero.cache_hit_rate,
        connections: PgHero.connections,
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

    def team_json(team)
      {
        id: team.id,
        name: team.name,
        slug: team.slug,
        personal: team.personal,
        owner: { id: team.owner.id, name: team.owner.name, email: team.owner.email },
        member_count: team.memberships.size,
        created_at: team.created_at.iso8601,
      }
    end

    def job_json(job)
      failed = job.failed_execution
      {
        id: job.id,
        class_name: job.class_name,
        queue_name: job.queue_name,
        status: job_status(job),
        error: failed&.error&.truncate(200),
        created_at: job.created_at.iso8601,
        finished_at: job.finished_at&.iso8601,
      }
    end

    def job_status(job)
      return "failed" if job.failed_execution.present?
      return "completed" if job.finished_at.present?
      return "scheduled" if job.scheduled_execution.present?
      return "ready" if job.ready_execution.present?

      "pending"
    end
  end
end
