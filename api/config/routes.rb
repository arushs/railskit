Rails.application.routes.draw do
  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  get "up" => "rails/health#show", as: :rails_health_check

  # Devise auth routes under /api/auth
  devise_for :users,
    path: "api/auth",
    path_names: {
      sign_in: "login",
      sign_out: "logout",
      registration: "signup"
    },
    controllers: {
      sessions: "api/auth/sessions",
      registrations: "api/auth/registrations",
      confirmations: "api/auth/confirmations",
      unlocks: "api/auth/unlocks",
      omniauth_callbacks: "api/auth/omniauth_callbacks"
    },
    defaults: { format: :json }

  namespace :api do
    get "health", to: "health#show"

    # Auth extras (current user, magic links, 2FA)
    namespace :auth do
      get "me", to: "me#show"
      post "magic_link", to: "magic_links#create"
      post "magic_link/verify", to: "magic_links#verify"

      # Two-Factor Authentication
      post "two_factor/enable", to: "two_factor#enable"
      post "two_factor/verify", to: "two_factor#verify"
      post "two_factor/disable", to: "two_factor#disable"
      post "two_factor/backup_codes", to: "two_factor#backup_codes"
      post "two_factor/challenge", to: "two_factor#challenge"
    end

    # Payments
    resources :plans, only: [:index]
    post "checkout", to: "checkout#create"
    post "billing-portal", to: "billing_portal#create"

    # Webhooks
    namespace :webhooks do
      post "stripe", to: "stripe#create"
    end



    # RAG: Collections & Documents
    resources :collections, only: %i[index show create update destroy] do
      post :search, on: :member
      resources :documents, only: %i[index show create destroy] do
        post :reprocess, on: :member
      end
    end

    # Global document search (across all collections)
    post "search", to: "search#create"

    # Admin
    namespace :admin do
      get "stats", to: "/api/admin#stats"
      get "users", to: "/api/admin#users"
      patch "users/:id", to: "/api/admin#update_user"
      delete "users/:id", to: "/api/admin#destroy_user"
      get "teams", to: "/api/admin#teams"
      delete "teams/:id", to: "/api/admin#destroy_team"
      get "queues", to: "/api/admin#queues"
      post "queues/:id/retry", to: "/api/admin#retry_job"
      post "queues/:id/discard", to: "/api/admin#discard_job"
      post "queues/bulk_retry", to: "/api/admin#bulk_retry"
      post "queues/bulk_discard", to: "/api/admin#bulk_discard"
      get "pghero", to: "/api/admin#pghero"
    end

    # Voice sessions
    resources :voice_sessions, only: %i[index show create destroy]

    # Agents (RubyLLM-powered)
    post "agents/route", to: "agents#route"
    post "agents/:agent_name/chat", to: "agents#chat"
    post "agents/:agent_name/stream", to: "agents#stream_chat"
  end
end
