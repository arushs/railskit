import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { teamsApi, type Team } from "@/lib/teams-api";
import { MembersList } from "@/components/teams/MembersList";
import { InvitationsList } from "@/components/teams/InvitationsList";
import { ArrowLeft, Settings, UserPlus, Mail, Trash2 } from "lucide-react";

export function TeamSettingsPage() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");

  // Invite form
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviting, setInviting] = useState(false);

  const loadTeam = useCallback(async () => {
    if (!teamId) return;
    const res = await teamsApi.get(Number(teamId));
    if (res.ok) {
      setTeam(res.data);
      setName(res.data.name);
    }
    setLoading(false);
  }, [teamId]);

  useEffect(() => {
    loadTeam();
  }, [loadTeam]);

  const handleSave = async () => {
    if (!team || !name.trim()) return;
    await teamsApi.update(team.id, name.trim());
    setEditing(false);
    loadTeam();
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team || !inviteEmail.trim()) return;
    setInviting(true);
    await teamsApi.invite(team.id, inviteEmail.trim(), inviteRole);
    setInviteEmail("");
    setInviteRole("member");
    setInviting(false);
    loadTeam();
  };

  const handleDelete = async () => {
    if (!team) return;
    if (!confirm(`Delete "${team.name}"? This cannot be undone.`)) return;
    await teamsApi.delete(team.id);
    navigate("/teams");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-400">
        Team not found
      </div>
    );
  }

  const canManage = team.current_user_role === "owner" || team.current_user_role === "admin";
  const isOwner = team.current_user_role === "owner";

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {/* Header */}
        <button
          onClick={() => navigate("/teams")}
          className="mb-6 flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to teams
        </button>

        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800 text-lg font-bold text-zinc-300">
            {team.name.charAt(0).toUpperCase()}
          </div>
          {editing ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-lg font-semibold text-white focus:border-blue-500 focus:outline-none"
              />
              <button onClick={handleSave} className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
                Save
              </button>
              <button onClick={() => { setEditing(false); setName(team.name); }} className="text-sm text-zinc-400 hover:text-white">
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">{team.name}</h1>
              {canManage && (
                <button onClick={() => setEditing(true)} className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-white">
                  <Settings className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Members */}
        <section className="mb-8">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">
            <UserPlus className="h-4 w-4" />
            Members ({team.members?.length || 0})
          </h2>
          {team.members && (
            <MembersList
              teamId={team.id}
              members={team.members}
              currentUserRole={team.current_user_role}
              onUpdate={loadTeam}
            />
          )}
        </section>

        {/* Invite */}
        {canManage && (
          <section className="mb-8">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">
              <Mail className="h-4 w-4" />
              Invite
            </h2>
            <form onSubmit={handleInvite} className="flex items-end gap-3">
              <div className="flex-1">
                <label className="mb-1 block text-xs text-zinc-500">Email address</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  required
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-zinc-500">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={inviting}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {inviting ? "Sending..." : "Send invite"}
              </button>
            </form>
          </section>
        )}

        {/* Pending Invitations */}
        {canManage && team.invitations && team.invitations.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-400">
              Pending Invitations
            </h2>
            <InvitationsList teamId={team.id} invitations={team.invitations} onUpdate={loadTeam} />
          </section>
        )}

        {/* Danger Zone */}
        {isOwner && !team.personal && (
          <section className="mt-12 rounded-lg border border-red-500/20 bg-red-500/5 p-4">
            <h2 className="mb-2 text-sm font-semibold text-red-400">Danger Zone</h2>
            <p className="mb-4 text-sm text-zinc-400">
              Permanently delete this team and all associated data.
            </p>
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4" />
              Delete team
            </button>
          </section>
        )}
      </div>
    </div>
  );
}
