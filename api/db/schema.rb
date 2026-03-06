# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_03_05_200003) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "agent_invocations", force: :cascade do |t|
    t.string "agent_name", null: false
    t.datetime "completed_at"
    t.datetime "created_at", null: false
    t.jsonb "input", default: {}
    t.jsonb "output", default: {}
    t.bigint "parent_invocation_id"
    t.string "role", default: "specialist", null: false
    t.datetime "started_at"
    t.string "status", default: "pending", null: false
    t.datetime "updated_at", null: false
    t.bigint "workflow_run_id", null: false
    t.index ["agent_name"], name: "index_agent_invocations_on_agent_name"
    t.index ["parent_invocation_id"], name: "index_agent_invocations_on_parent_invocation_id"
    t.index ["status"], name: "index_agent_invocations_on_status"
    t.index ["workflow_run_id"], name: "index_agent_invocations_on_workflow_run_id"
  end

  create_table "agent_workflows", force: :cascade do |t|
    t.jsonb "config", default: {}
    t.string "coordinator_agent", null: false
    t.datetime "created_at", null: false
    t.text "description"
    t.string "name", null: false
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_agent_workflows_on_name", unique: true
  end

  create_table "chats", force: :cascade do |t|
    t.string "agent_class", null: false
    t.datetime "created_at", null: false
    t.jsonb "metadata", default: {}
    t.string "model_id"
    t.datetime "updated_at", null: false
    t.bigint "user_id"
    t.index ["agent_class"], name: "index_chats_on_agent_class"
    t.index ["user_id"], name: "index_chats_on_user_id"
  end

  create_table "jwt_denylists", force: :cascade do |t|
    t.datetime "exp", null: false
    t.string "jti", null: false
    t.index ["jti"], name: "index_jwt_denylists_on_jti"
  end

  create_table "messages", force: :cascade do |t|
    t.bigint "chat_id"
    t.text "content"
    t.decimal "cost_cents"
    t.datetime "created_at", null: false
    t.string "finish_reason"
    t.integer "input_tokens"
    t.string "model_id"
    t.string "name"
    t.integer "output_tokens"
    t.string "role", null: false
    t.integer "token_count"
    t.string "tool_call_id"
    t.jsonb "tool_calls"
    t.jsonb "tool_result"
    t.datetime "updated_at", null: false
    t.index ["chat_id", "created_at"], name: "index_messages_on_chat_id_and_created_at"
    t.index ["chat_id"], name: "index_messages_on_chat_id"
    t.index ["role"], name: "index_messages_on_role"
  end

  create_table "plans", force: :cascade do |t|
    t.boolean "active", default: true, null: false
    t.integer "amount_cents", default: 0, null: false
    t.datetime "created_at", null: false
    t.string "currency", default: "usd", null: false
    t.jsonb "features", default: {}, null: false
    t.string "interval", default: "month", null: false
    t.string "name", null: false
    t.string "slug", null: false
    t.integer "sort_order", default: 0, null: false
    t.string "stripe_price_id", null: false
    t.datetime "updated_at", null: false
    t.index ["active"], name: "index_plans_on_active"
    t.index ["slug"], name: "index_plans_on_slug", unique: true
    t.index ["stripe_price_id"], name: "index_plans_on_stripe_price_id", unique: true
  end

  create_table "shared_contexts", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "key", null: false
    t.datetime "updated_at", null: false
    t.jsonb "value", default: {}
    t.bigint "workflow_run_id", null: false
    t.string "written_by"
    t.index ["workflow_run_id", "key"], name: "index_shared_contexts_on_workflow_run_id_and_key", unique: true
    t.index ["workflow_run_id"], name: "index_shared_contexts_on_workflow_run_id"
  end

  create_table "subscriptions", force: :cascade do |t|
    t.datetime "cancel_at"
    t.datetime "canceled_at"
    t.datetime "created_at", null: false
    t.datetime "current_period_end"
    t.datetime "current_period_start"
    t.bigint "plan_id", null: false
    t.string "status", default: "incomplete", null: false
    t.string "stripe_customer_id", null: false
    t.string "stripe_subscription_id", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["plan_id"], name: "index_subscriptions_on_plan_id"
    t.index ["status"], name: "index_subscriptions_on_status"
    t.index ["stripe_customer_id"], name: "index_subscriptions_on_stripe_customer_id"
    t.index ["stripe_subscription_id"], name: "index_subscriptions_on_stripe_subscription_id", unique: true
    t.index ["user_id"], name: "index_subscriptions_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "avatar_url"
    t.datetime "created_at", null: false
    t.datetime "current_sign_in_at"
    t.string "current_sign_in_ip"
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.datetime "last_sign_in_at"
    t.string "last_sign_in_ip"
    t.datetime "magic_link_sent_at"
    t.string "magic_link_token"
    t.string "name"
    t.string "plan", default: "free", null: false
    t.string "provider"
    t.datetime "remember_created_at"
    t.datetime "reset_password_sent_at"
    t.string "reset_password_token"
    t.integer "sign_in_count", default: 0, null: false
    t.string "uid"
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["magic_link_token"], name: "index_users_on_magic_link_token", unique: true
    t.index ["provider", "uid"], name: "index_users_on_provider_and_uid", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
  end

  create_table "workflow_runs", force: :cascade do |t|
    t.bigint "agent_workflow_id", null: false
    t.datetime "completed_at"
    t.jsonb "context", default: {}
    t.datetime "created_at", null: false
    t.jsonb "input", default: {}
    t.jsonb "output", default: {}
    t.datetime "started_at"
    t.string "status", default: "pending", null: false
    t.datetime "updated_at", null: false
    t.index ["agent_workflow_id"], name: "index_workflow_runs_on_agent_workflow_id"
    t.index ["status"], name: "index_workflow_runs_on_status"
  end

  add_foreign_key "agent_invocations", "agent_invocations", column: "parent_invocation_id"
  add_foreign_key "agent_invocations", "workflow_runs"
  add_foreign_key "chats", "users"
  add_foreign_key "messages", "chats"
  add_foreign_key "shared_contexts", "workflow_runs"
  add_foreign_key "subscriptions", "plans"
  add_foreign_key "subscriptions", "users"
  add_foreign_key "workflow_runs", "agent_workflows"
end
