import { useNavigate } from "react-router";
import { useTeam } from "@/contexts/TeamContext";
import { RoleBadge } from "@/components/teams/RoleBadge";
import { Users, Settings, Crown, Plus } from "lucide-react";
import { useState } from "react";
import { teamsApi } from "@/lib/teams-api";

export function TeamsListPage() {
  const navigate = useNavigate();
  const { teams, switchTeam, currentTeam, refreshTeams } = useTeam();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const res = await teamsApi.create(newName.trim());
    if (res.ok) {
      await refreshTeams();
      setNewName("");
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Teams</h1>
            <p className="mt-1 text-sm text-zinc-400">Manage your teams and workspaces</p>
          </div>
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New team
          </button>
        </div>

        {creating && (
          <div className="mb-6 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <h3 className="mb-3 text-sm font-medium">Create a new team</h3>
            <div className="flex gap-3">
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                placeholder="Team name..."
                className="flex-1 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
              />
              <button
                onClick={handleCreate}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Create
              </button>
              <button
                onClick={() => { setCreating(false); setNewName(""); }}
                className="rounded-md px-4 py-2 text-sm text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {teams.map((team) => (
            <div
              key={team.id}
              className={`group rounded-lg border p-4 transition-colors cursor-pointer hover:border-zinc-700 ${
                team.id === currentTeam?.id ? "border-blue-500/40 bg-blue-500/5" : "border-zinc-800 bg-zinc-900"
              }`}
              onClick={() => switchTeam(team)}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800 text-lg font-bold text-zinc-300 group-hover:bg-zinc-700">
                  {team.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-white truncate">{team.name}</h3>
                    {team.personal && (
                      <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-500">Personal</span>
                    )}
                    {team.id === currentTeam?.id && (
                      <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[10px] text-blue-400">Active</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {team.members_count} member{team.members_count !== 1 ? "s" : ""}
                    </span>
                    {team.current_user_role === "owner" && (
                      <span className="flex items-center gap-1 text-amber-500">
                        <Crown className="h-3 w-3" />
                        Owner
                      </span>
                    )}
                  </div>
                </div>
                <RoleBadge role={team.current_user_role} />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/teams/${team.id}/settings`);
                  }}
                  className="rounded p-2 text-zinc-500 opacity-0 group-hover:opacity-100 hover:bg-zinc-800 hover:text-white transition-all"
                >
                  <Settings className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {teams.length === 0 && (
          <div className="rounded-lg border border-dashed border-zinc-800 py-12 text-center">
            <Users className="mx-auto h-8 w-8 text-zinc-600" />
            <p className="mt-3 text-sm text-zinc-400">No teams yet</p>
            <button
              onClick={() => setCreating(true)}
              className="mt-3 text-sm font-medium text-blue-400 hover:text-blue-300"
            >
              Create your first team
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
