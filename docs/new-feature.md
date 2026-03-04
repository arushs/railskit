# Add a New Feature

How to add a complete feature to RailsKit — database model → API endpoint → React page. We'll build "Projects" as the example.

---

## 1. Generate the Migration

```bash
cd api
bin/rails generate migration CreateProjects name:string description:text user:references status:string
```

If you're using PostgreSQL (the default), this creates a standard ActiveRecord migration:

```ruby
class CreateProjects < ActiveRecord::Migration[8.1]
  def change
    create_table :projects do |t|
      t.string :name
      t.text :description
      t.references :user, null: false, foreign_key: true
      t.string :status

      t.timestamps
    end
  end
end
```

> **Note:** The migration generator is adapter-aware. With Supabase it generates raw SQL; with Convex it generates a TypeScript schema stub. Override with `--adapter supabase`.

Run the migration:
```bash
bin/rails db:migrate
```

## 2. Create the Model

`api/app/models/project.rb`:

```ruby
class Project < ApplicationRecord
  belongs_to :user

  validates :name, presence: true
  validates :status, inclusion: { in: %w[draft active archived] }

  scope :active, -> { where(status: "active") }
  scope :by_user, ->(user) { where(user: user) }
end
```

## 3. Create the Controller

`api/app/controllers/api/projects_controller.rb`:

```ruby
module Api
  class ProjectsController < ApplicationController
    before_action :authenticate_user_from_jwt!
    before_action :set_project, only: [:show, :update, :destroy]

    def index
      projects = current_user.projects.order(created_at: :desc)
      render json: { projects: projects }
    end

    def show
      render json: { project: @project }
    end

    def create
      project = current_user.projects.build(project_params)
      if project.save
        render json: { project: project }, status: :created
      else
        render_unprocessable(project)
      end
    end

    def update
      if @project.update(project_params)
        render json: { project: @project }
      else
        render_unprocessable(@project)
      end
    end

    def destroy
      @project.destroy!
      render json: { message: "Project deleted" }
    end

    private

    def set_project
      @project = current_user.projects.find(params[:id])
    end

    def project_params
      params.require(:project).permit(:name, :description, :status)
    end
  end
end
```

### Authentication

`authenticate_user_from_jwt!` is defined in `ApplicationController`. It:
1. Extracts the JWT from the `jwt` httpOnly cookie (or `Authorization` header)
2. Decodes it and finds the user
3. Returns 401 if invalid

`current_user` is available after authentication.

`render_unprocessable(resource)` is a helper that returns validation errors as JSON:
```json
{ "error": "Validation failed", "details": ["Name can't be blank"] }
```

## 4. Add Routes

`api/config/routes.rb`:

```ruby
namespace :api do
  # ... existing routes ...
  resources :projects
end
```

This creates:
| Method | Path | Action |
|---|---|---|
| GET | `/api/projects` | index |
| POST | `/api/projects` | create |
| GET | `/api/projects/:id` | show |
| PATCH | `/api/projects/:id` | update |
| DELETE | `/api/projects/:id` | destroy |

## 5. Add the User Association

`api/app/models/user.rb` — add the association:

```ruby
has_many :projects, dependent: :destroy
```

## 6. Create the React Page

`web/src/pages/ProjectsPage.tsx`:

```tsx
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface Project {
  id: number;
  name: string;
  description: string;
  status: string;
  created_at: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ projects: Project[] }>("/api/projects")
      .then((res) => {
        if (res.ok) setProjects(res.data.projects);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Projects</h1>
      <div className="space-y-4">
        {projects.map((project) => (
          <div key={project.id} className="border rounded-lg p-4">
            <h2 className="text-lg font-semibold">{project.name}</h2>
            <p className="text-muted-foreground">{project.description}</p>
            <span className="text-sm">{project.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### API Client

The `api` object from `web/src/lib/api.ts` handles:
- Prefixing with `VITE_API_URL`
- Sending `credentials: "include"` for httpOnly cookie auth
- JSON serialization/deserialization
- Typed responses via generics

## 7. Add the Route

`web/src/main.tsx`:

```tsx
import ProjectsPage from "./pages/ProjectsPage";

// Inside <Routes>, under the AuthGuard:
<Route element={<AuthGuard />}>
  <Route element={<DashboardLayout />}>
    <Route path="/dashboard" element={<DashboardPage />} />
    <Route path="/dashboard/projects" element={<ProjectsPage />} />
    {/* ... */}
  </Route>
</Route>
```

## 8. Test the Full Flow

```bash
# Create a project (need a valid JWT cookie — sign in first)
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT" \
  -d '{"project": {"name": "My Project", "description": "A cool project", "status": "active"}}'
```

---

## Feature Gating with Plans

If this feature should be restricted to paid plans, use the `Billable` concern:

```ruby
# In your controller
def create
  unless current_user.feature?("projects")
    return render json: { error: "Upgrade to create projects" }, status: :forbidden
  end
  # ... normal create logic
end
```

The `feature?` method checks the user's active subscription's plan features (stored as JSONB on the Plan model).

Add the feature to your plan seeds:
```ruby
# db/seeds/plans.rb
{
  name: "Pro Monthly",
  features: { "projects" => true, "max_projects" => 50 }
}
```
