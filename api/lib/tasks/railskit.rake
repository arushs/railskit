# frozen_string_literal: true

namespace :railskit do
  desc "Generate web/src/railskit.generated.json from railskit.yml for the frontend"
  task generate_frontend_config: :environment do
    path = RailsKit.generate_frontend_json
    puts "Generated frontend config at #{path}"
  end
end
