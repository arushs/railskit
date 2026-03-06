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

ActiveRecord::Schema[8.1].define(version: 2026_03_06_100003) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"
  enable_extension "vector"

  create_table "active_storage_attachments", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.bigint "record_id", null: false
    t.string "record_type", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", force: :cascade do |t|
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.string "content_type"
    t.datetime "created_at", null: false
    t.string "filename", null: false
    t.string "key", null: false
    t.text "metadata"
    t.string "service_name", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "article_chunks", force: :cascade do |t|
    t.bigint "article_id", null: false
    t.integer "chunk_index", null: false
    t.text "chunk_text", null: false
    t.datetime "created_at", null: false
    t.vector "embedding", limit: 768
    t.tsvector "searchable"
    t.datetime "updated_at", null: false
    t.index ["article_id", "chunk_index"], name: "index_article_chunks_on_article_id_and_chunk_index", unique: true
    t.index ["article_id"], name: "index_article_chunks_on_article_id"
    t.index ["embedding"], name: "index_article_chunks_on_embedding", opclass: :vector_cosine_ops, using: :hnsw
    t.index ["searchable"], name: "index_article_chunks_on_searchable", using: :gin
  end

  create_table "articles", force: :cascade do |t|
    t.text "body", null: false
    t.datetime "created_at", null: false
    t.datetime "published_at"
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.index ["published_at"], name: "index_articles_on_published_at"
  end

  create_table "audio_segments", force: :cascade do |t|
    t.binary "content", null: false
    t.datetime "created_at", null: false
    t.float "duration"
    t.integer "sequence_number"
    t.string "speaker", null: false
    t.text "transcript"
    t.datetime "updated_at", null: false
    t.bigint "voice_session_id", null: false
    t.index ["speaker"], name: "index_audio_segments_on_speaker"
    t.index ["voice_session_id", "sequence_number"], name: "index_audio_segments_on_voice_session_id_and_sequence_number"
    t.index ["voice_session_id"], name: "index_audio_segments_on_voice_session_id"
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

  create_table "chunks", force: :cascade do |t|
    t.text "content", null: false
    t.datetime "created_at", null: false
    t.bigint "document_id", null: false
    t.integer "position", default: 0, null: false
    t.integer "token_count", default: 0
    t.datetime "updated_at", null: false
    t.index ["document_id", "position"], name: "index_chunks_on_document_id_and_position"
    t.index ["document_id"], name: "index_chunks_on_document_id"
  end

  create_table "document_collections", force: :cascade do |t|
    t.integer "chunk_overlap", default: 50, null: false
    t.integer "chunk_size", default: 512, null: false
    t.string "chunking_strategy", default: "paragraph", null: false
    t.datetime "created_at", null: false
    t.string "embedding_model", default: "text-embedding-3-small", null: false
    t.jsonb "metadata", default: {}
    t.string "name", null: false
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_document_collections_on_name", unique: true
  end

  create_table "documents", force: :cascade do |t|
    t.string "content_type"
    t.datetime "created_at", null: false
    t.bigint "document_collection_id", null: false
    t.text "error_message"
    t.string "name", null: false
    t.bigint "size"
    t.string "status", default: "processing", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id"
    t.index ["document_collection_id"], name: "index_documents_on_document_collection_id"
    t.index ["status"], name: "index_documents_on_status"
    t.index ["user_id"], name: "index_documents_on_user_id"
  end

  create_table "embeddings", force: :cascade do |t|
    t.bigint "chunk_id", null: false
    t.datetime "created_at", null: false
    t.string "model_used", default: "text-embedding-3-small", null: false
    t.datetime "updated_at", null: false
    t.vector "vector", limit: 1536
    t.index ["chunk_id"], name: "index_embeddings_on_chunk_id", unique: true
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

  create_table "voice_presets", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.boolean "default", default: false
    t.string "name", null: false
    t.string "provider", default: "elevenlabs", null: false
    t.jsonb "settings", default: {}
    t.datetime "updated_at", null: false
    t.string "voice_id", null: false
    t.index ["name"], name: "index_voice_presets_on_name", unique: true
    t.index ["provider"], name: "index_voice_presets_on_provider"
  end

  create_table "voice_sessions", force: :cascade do |t|
    t.string "audio_format", default: "pcm_16000"
    t.bigint "chat_id", null: false
    t.datetime "created_at", null: false
    t.integer "duration"
    t.datetime "ended_at"
    t.datetime "started_at", null: false
    t.string "status", default: "active", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.bigint "voice_preset_id"
    t.index ["chat_id"], name: "index_voice_sessions_on_chat_id"
    t.index ["status"], name: "index_voice_sessions_on_status"
    t.index ["user_id"], name: "index_voice_sessions_on_user_id"
    t.index ["voice_preset_id"], name: "index_voice_sessions_on_voice_preset_id"
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "article_chunks", "articles"
  add_foreign_key "audio_segments", "voice_sessions"
  add_foreign_key "chats", "users"
  add_foreign_key "chunks", "documents"
  add_foreign_key "documents", "document_collections"
  add_foreign_key "documents", "users"
  add_foreign_key "embeddings", "chunks"
  add_foreign_key "messages", "chats"
  add_foreign_key "subscriptions", "plans"
  add_foreign_key "subscriptions", "users"
  add_foreign_key "voice_sessions", "chats"
  add_foreign_key "voice_sessions", "users"
  add_foreign_key "voice_sessions", "voice_presets"
end
