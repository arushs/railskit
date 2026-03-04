Rails.application.routes.draw do
  # Health checks
  get "up" => "rails/health#show", as: :rails_health_check

  # Devise (OmniAuth callbacks only — sessions/registrations are custom below)
  devise_for :users,
             path: "api",
             controllers: {
               omniauth_callbacks: "api/auth/omniauth_callbacks"
             },
             skip: [:sessions, :registrations, :passwords]

  namespace :api do
    get "health", to: "health#show"

    namespace :auth do
      # Custom auth endpoints
      devise_scope :user do
        post   "sign_up",  to: "registrations#create"
        post   "sign_in",  to: "sessions#create"
        delete "sign_out", to: "sessions#destroy"
      end

      # Magic links
      post "magic_link",        to: "magic_links#create"
      post "magic_link/verify", to: "magic_links#verify"

      # Current user profile
      get   "me", to: "me#show"
      patch "me", to: "me#update"
    end
  end
end
