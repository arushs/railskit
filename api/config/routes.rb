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
      omniauth_callbacks: "api/auth/omniauth_callbacks"
    },
    defaults: { format: :json }

  namespace :api do
    get "health", to: "health#show"

    # Auth extras (current user, magic links)
    namespace :auth do
      get "me", to: "me#show"
      post "magic_link", to: "magic_links#create"
      post "magic_link/verify", to: "magic_links#verify"
    end

    # Payments
    resources :plans, only: [:index]
    post "checkout", to: "checkout#create"
    post "billing-portal", to: "billing_portal#create"

    # Webhooks
    namespace :webhooks do
      post "stripe", to: "stripe#create"
    end



    # Teams
    resources :teams do
      resources :memberships, controller: "team_memberships", only: %i[index update destroy]
      resources :invitations, controller: "team_invitations", only: %i[index create destroy]
    end
    post "invitations/:token/accept", to: "team_invitations#accept"

    # RAG: Collections & Documents
    resources :collections, only: %i[index show create update destroy] do
      post :search, on: :member
      resources :documents, only: %i[index show create destroy] do
        post :reprocess, on: :member
      end
    end

    # Global document search (across all collections)
    post "search", to: "search#create"

    # Voice sessions
    resources :voice_sessions, only: %i[index show create destroy]

    # Agents (RubyLLM-powered)
    post "agents/route", to: "agents#route"
    post "agents/:agent_name/chat", to: "agents#chat"
    post "agents/:agent_name/stream", to: "agents#stream_chat"
  end
end
