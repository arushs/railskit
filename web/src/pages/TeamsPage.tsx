import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router";
import { teamsApi } from "@/lib/teams-api";
import type { Team } from "@/types/team";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Settings, Crown, Shield, User, Loader2 } from "lucide-react";

const ROLE_CONFIG: Record<string, { label: string; icon: typeof Crown; variant: "default" | "secondary" | "outline" }> = {
  owner: { label: "Owner", icon: Crown, variant: "default" },
  admin: { label: "Admin", icon: Shield, variant: "secondary" },
  member: { label: "Member", icon: User, variant: "outline" },
};

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    teamsApi
      .list()
      .then((res) => {
        if (res.ok) setTeams(Array.isArray(res.data) ? res.data : []);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;

    setCreating(true);
    setError("");
    try {
      const res = await teamsApi.create(newName.trim());
      if (res.ok) {
        setNewName("");
        setShowCreate(false);
        // Refresh list
        const listRes = await teamsApi.list();
        if (listRes.ok) setTeams(Array.isArray(listRes.data) ? listRes.data : []);
      } else {
        const errData = res.data as unknown as { errors?: string[] };
        setError(errData.errors?.join(", ") || "Failed to create team");
      }
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Teams</h1>
          <p className="mt-1 text-zinc-500 dark:text-zinc-400">
            Manage your team spaces and collaborators.
          </p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)} size="sm">
          <Plus className="w-4 h-4 mr-1.5" />
          New Team
        </Button>
      </div>

      {/* Create form */}
      {showCreate && (
        <Card className="dark:bg-zinc-900/50 bg-white">
          <CardContent className="p-6">
            <form onSubmit={handleCreate} className="flex items-end gap-3">
              <div className="flex-1 space-y-2">
                <Label htmlFor="team-name">Team Name</Label>
                <Input
                  id="team-name"
                  placeholder="My Team"
                  value={newName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewName(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={creating}>
                {creating ? "Creating…" : "Create"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowCreate(false);
                  setNewName("");
                  setError("");
                }}
              >
                Cancel
              </Button>
            </form>
            {error && (
              <p className="mt-2 text-sm text-red-500">{error}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Teams grid */}
      {teams.length === 0 ? (
        <Card className="dark:bg-zinc-900/50 bg-white">
          <CardContent className="p-12 text-center">
            <Users className="w-12 h-12 mx-auto mb-3 text-zinc-300 dark:text-zinc-600" />
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              No teams yet
            </p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
              Create a team to start collaborating.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => {
            const roleConfig = ROLE_CONFIG[team.role] || ROLE_CONFIG.member;
            const RoleIcon = roleConfig.icon;

            return (
              <Card
                key={team.id}
                className="dark:bg-zinc-900/50 bg-white hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
              >
                <CardHeader className="flex flex-row items-start justify-between p-6 pb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-theme-primary/10 text-theme-primary shrink-0">
                      <Users className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-zinc-900 dark:text-white truncate">
                        {team.name}
                      </CardTitle>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                        {team.slug}
                      </p>
                    </div>
                  </div>
                  <Link
                    to={`/teams/${team.id}/settings`}
                    className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors shrink-0"
                  >
                    <Settings className="w-4 h-4" />
                  </Link>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={roleConfig.variant}>
                        <RoleIcon className="w-3 h-3 mr-1" />
                        {roleConfig.label}
                      </Badge>
                    </div>
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">
                      {team.member_count} {team.member_count === 1 ? "member" : "members"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
