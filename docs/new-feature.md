# Add a New Feature

How to add a complete feature to RailsKit — database model → API endpoint → React page. We'll build "Projects" as the example.

---

## The Pattern

```
1. Model (Rails)      → Database table + business logic
2. Controller (Rails)  → API endpoint
3. Hook (React)        → Data fetching with TanStack Query
4. Page (React)        → UI components
5. Route (React)       → Wire it into the router
```

---

## 1. Create the Model

```bash
cd api
bin/rails generate model Project \
  name:string \
  description:text \
  user:references \
  status:string
bin/rails db:migrate
```

```ruby
# api/app/models/project.rb
class Project < ApplicationRecord
  belongs_to :user

  validates :name, presence: true, length: { maximum: 100 }
  validates :status, inclusion: { in: %w[active paused completed archived] }

  scope :active, -> { where(status: "active") }
  scope :for_user, ->(user) { where(user: user) }
end
```

## 2. Create the Controller

```bash
bin/rails generate controller Api::V1::Projects
```

```ruby
# api/app/controllers/api/v1/projects_controller.rb
module Api
  module V1
    class ProjectsController < ApplicationController
      before_action :authenticate_user!
      before_action :set_project, only: [:show, :update, :destroy]

      def index
        projects = current_user.projects.order(created_at: :desc)
        render json: projects
      end

      def show
        render json: @project
      end

      def create
        project = current_user.projects.build(project_params)

        if project.save
          render json: project, status: :created
        else
          render json: { errors: project.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def update
        if @project.update(project_params)
          render json: @project
        else
          render json: { errors: @project.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        @project.destroy
        head :no_content
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
end
```

Add the route:

```ruby
# api/config/routes.rb
namespace :api do
  namespace :v1 do
    resources :projects
  end
end
```

## 3. Create the React Hook

```typescript
// web/src/hooks/useProjects.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface Project {
  id: number;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'completed' | 'archived';
  created_at: string;
}

export const useProjects = () =>
  useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: () => api.get('/api/v1/projects').then(r => r.data),
  });

export const useProject = (id: number) =>
  useQuery<Project>({
    queryKey: ['projects', id],
    queryFn: () => api.get(`/api/v1/projects/${id}`).then(r => r.data),
  });

export const useCreateProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      api.post('/api/v1/projects', { project: data }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
};

export const useUpdateProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number } & Partial<Project>) =>
      api.patch(`/api/v1/projects/${id}`, { project: data }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
};

export const useDeleteProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/api/v1/projects/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
};
```

## 4. Create the Page

```tsx
// web/src/pages/Projects.tsx
import { useState } from 'react';
import { useProjects, useCreateProject, useDeleteProject } from '@/hooks/useProjects';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2 } from 'lucide-react';

export default function Projects() {
  const { data: projects, isLoading } = useProjects();
  const createProject = useCreateProject();
  const deleteProject = useDeleteProject();
  const [newName, setNewName] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    createProject.mutate({ name: newName });
    setNewName('');
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Projects</h1>

      <form onSubmit={handleCreate} className="flex gap-2">
        <Input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="New project name..."
        />
        <Button type="submit" disabled={createProject.isPending}>
          <Plus className="h-4 w-4 mr-1" /> Create
        </Button>
      </form>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects?.map(project => (
          <Card key={project.id}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">{project.name}</CardTitle>
              <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                {project.status}
              </Badge>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {project.description || 'No description'}
              </p>
              <div className="mt-4 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteProject.mutate(project.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

## 5. Add the Route

```tsx
// web/src/routes.tsx — add to dashboard routes:
{ path: 'projects', element: <Projects /> }
```

```tsx
// web/src/components/dashboard/Sidebar.tsx — add nav item:
{ name: 'Projects', href: '/dashboard/projects', icon: FolderIcon }
```

---

## 6. Add an Agent Tool (Optional)

```bash
cd api && bin/rails generate tool ListProjects
```

```ruby
class ListProjects < RubyLLM::Tool
  description "List the current user's projects, optionally filtered by status"
  param :status, desc: "Filter: active, paused, completed, archived"

  def execute(status: nil)
    projects = current_user.projects
    projects = projects.where(status: status) if status
    projects.limit(10).map { |p| { id: p.id, name: p.name, status: p.status } }
  end
end
```

Then add to any agent: `tools ..., ListProjects`

---

## Checklist

- [ ] **Model** — Migration, validations, associations, scopes
- [ ] **Controller** — CRUD endpoints under `Api::V1`
- [ ] **Routes** — `config/routes.rb`
- [ ] **Auth** — `authenticate_user!`, scoped to `current_user`
- [ ] **Hook** — TanStack Query hooks for all operations
- [ ] **Page** — React component with loading/error states
- [ ] **Route** — React Router entry
- [ ] **Navigation** — Sidebar link
- [ ] **Tests** — Model + request (Rails), component (React)
- [ ] **Tool** — (Optional) Agent tool for AI access
