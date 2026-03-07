import { useEffect, useState, type FormEvent } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { teamsApi } from "@/lib/teams-api";
import type { Team, Membership, TeamInvitation } from "@/types/team";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Crown,
  Shield,
  User,
  Trash2,
  Mail,
  Clock,
  X,
  Loader2,
  AlertTriangle,
} from "lucide-react";

const ROLE_OPTIONS = [
  { value: "member", label: "Member", icon: User },
  { value: "admin", label: "Admin", icon: Shield },
];

export default function TeamSettingsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<Membership[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit state
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Invite state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");

  // Delete state
  const [confirmDelete, setConfirmDelete] = useState("");
  const [deleting, setDeleting] = useState(false);

  const isOwner = team?.role === "owner";
  const isAdmin = team?.role === "admin" || isOwner;

  useEffect(() => {
    if (!id) return;
    Promise.all([
      teamsApi.get(id),
      teamsApi.memberships(id),
      teamsApi.invitations(id),
    ])
      .then(([teamRes, membersRes, invitesRes]) => {
        if (teamRes.ok) {
          setTeam(teamRes.data);
          setEditName(teamRes.data.name);
        }
        if (membersRes.ok) setMembers(Array.isArray(membersRes.data) ? membersRes.data : []);
        if (invitesRes.ok) setInvitations(Array.isArray(invitesRes.data) ? invitesRes.data : []);
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSaveName(e: FormEvent) {
    e.preventDefault();
    if (!id || !editName.trim()) return;
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await teamsApi.update(id, editName.trim());
      if (res.ok) {
        setTeam((t) => (t ? { ...t, name: res.data.name, slug: res.data.slug } : t));
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleRoleChange(membershipId: number, newRole: string) {
    if (!id) return;
    const res = await teamsApi.updateMembership(id, membershipId, newRole);
    if (res.ok) {
      setMembers((prev) =>
        prev.map((m) => (m.id === membershipId ? { ...m, role: res.data.role as Membership["role"] } : m))
      );
    }
  }

  async function handleRemoveMember(membershipId: number) {
    if (!id) return;
    if (!confirm("Remove this member from the team?")) return;
    const res = await teamsApi.removeMember(id, membershipId);
    if (res.ok) {
      setMembers((prev) => prev.filter((m) => m.id !== membershipId));
      setTeam((t) => (t ? { ...t, member_count: t.member_count - 1 } : t));
    }
  }

  async function handleInvite(e: FormEvent) {
    e.preventDefault();
    if (!id || !inviteEmail.trim()) return;
    setInviting(true);
    setInviteError("");
    try {
      const res = await teamsApi.invite(id, inviteEmail.trim(), inviteRole);
      if (res.ok) {
        setInvitations((prev) => [res.data, ...prev]);
        setInviteEmail("");
        setInviteRole("member");
      } else {
        const errData = res.data as unknown as { errors?: string[] };
        setInviteError(errData.errors?.join(", ") || "Failed to send invitation");
      }
    } finally {
      setInviting(false);
    }
  }

  async function handleCancelInvite(invitationId: number) {
    if (!id) return;
    const res = await teamsApi.cancelInvitation(id, invitationId);
    if (res.ok) {
      setInvitations((prev) => prev.filter((i) => i.id !== invitationId));
    }
  }

  async function handleDeleteTeam() {
    if (!id || confirmDelete !== team?.name) return;
    setDeleting(true);
    try {
      const res = await teamsApi.delete(id);
      if (res.ok) navigate("/teams");
    } finally {
      setDeleting(false);
    }
  }

  function roleIcon(role: string) {
    switch (role) {
      case "owner":
        return <Crown className="w-3 h-3" />;
      case "admin":
        return <Shield className="w-3 h-3" />;
      default:
        return <User className="w-3 h-3" />;
    }
  }

  function roleBadgeVariant(role: string): "default" | "secondary" | "outline" {
    switch (role) {
      case "owner":
        return "default";
      case "admin":
        return "secondary";
      default:
        return "outline";
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="flex items-center justify-center py-32">
        <p className="text-red-500">Team not found</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 animate-in">
      {/* Back */}
      <Link
        to="/teams"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Teams
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          {team.name}
        </h1>
        <p className="mt-1 text-zinc-500 dark:text-zinc-400">
          Manage team settings, members, and invitations.
        </p>
      </div>

      {/* Team Name */}
      {isAdmin && (
        <Card className="dark:bg-zinc-900/50 bg-white">
          <CardHeader className="p-6">
            <CardTitle className="text-zinc-900 dark:text-white">
              Team Details
            </CardTitle>
            <CardDescription className="text-zinc-500 dark:text-zinc-400">
              Update your team's name and identity.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <form onSubmit={handleSaveName} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="team-name">Team Name</Label>
                <Input
                  id="team-name"
                  value={editName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {team.slug}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button type="submit" size="sm" disabled={saving}>
                  {saving ? "Saving…" : "Save Changes"}
                </Button>
                {saveSuccess && (
                  <span className="text-sm text-emerald-500">Updated!</span>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Members */}
      <Card className="dark:bg-zinc-900/50 bg-white">
        <CardHeader className="p-6">
          <CardTitle className="text-zinc-900 dark:text-white">
            Members
          </CardTitle>
          <CardDescription className="text-zinc-500 dark:text-zinc-400">
            {team.member_count} {team.member_count === 1 ? "member" : "members"} in this team.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="space-y-3">
            {members.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between py-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0 last:pb-0"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar
                    src={m.user.avatar_url}
                    fallback={m.user.name || m.user.email}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                      {m.user.name || m.user.email}
                    </p>
                    {m.user.name && (
                      <p className="text-xs text-zinc-400 truncate">
                        {m.user.email}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {m.role === "owner" ? (
                    <Badge variant="default">
                      <Crown className="w-3 h-3 mr-1" />
                      Owner
                    </Badge>
                  ) : isAdmin ? (
                    <>
                      <select
                        value={m.role}
                        onChange={(e) => handleRoleChange(m.id, e.target.value)}
                        className="h-8 px-2 text-xs border border-zinc-200 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
                      >
                        {ROLE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleRemoveMember(m.id)}
                        className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors"
                        title="Remove member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <Badge variant={roleBadgeVariant(m.role)}>
                      {roleIcon(m.role)}
                      <span className="ml-1 capitalize">{m.role}</span>
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Invitations */}
      {isAdmin && (
        <>
          <Separator />

          <Card className="dark:bg-zinc-900/50 bg-white">
            <CardHeader className="p-6">
              <CardTitle className="text-zinc-900 dark:text-white">
                Invitations
              </CardTitle>
              <CardDescription className="text-zinc-500 dark:text-zinc-400">
                Invite new members by email. Invitations expire after 7 days.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-6">
              {/* Invite form */}
              <form onSubmit={handleInvite} className="flex items-end gap-3">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="invite-email">Email</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="colleague@example.com"
                    value={inviteEmail}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInviteEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="w-32 space-y-2">
                  <Label htmlFor="invite-role">Role</Label>
                  <select
                    id="invite-role"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full h-9 px-3 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <Button type="submit" disabled={inviting}>
                  <Mail className="w-4 h-4 mr-1.5" />
                  {inviting ? "Sending…" : "Invite"}
                </Button>
              </form>

              {inviteError && (
                <p className="text-sm text-red-500">{inviteError}</p>
              )}

              {/* Pending list */}
              {invitations.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Pending Invitations
                  </p>
                  {invitations.map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between py-2.5 px-3 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Mail className="w-4 h-4 text-zinc-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm text-zinc-900 dark:text-white truncate">
                            {inv.email}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              {inv.role}
                            </Badge>
                            <span className="flex items-center gap-1 text-[11px] text-zinc-400">
                              <Clock className="w-3 h-3" />
                              Expires{" "}
                              {new Date(inv.expires_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleCancelInvite(inv.id)}
                        className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors shrink-0"
                        title="Cancel invitation"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Danger Zone */}
      {isOwner && (
        <>
          <Separator />

          <Card className="border-red-200 dark:border-red-900/50 dark:bg-zinc-900/50 bg-white">
            <CardHeader className="p-6">
              <CardTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Danger Zone
              </CardTitle>
              <CardDescription className="text-zinc-500 dark:text-zinc-400">
                Permanently delete this team and all its data.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="confirm-delete">
                  Type <span className="font-mono font-bold">{team.name}</span>{" "}
                  to confirm
                </Label>
                <Input
                  id="confirm-delete"
                  placeholder={team.name}
                  value={confirmDelete}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmDelete(e.target.value)}
                />
              </div>
              <button
                disabled={confirmDelete !== team.name || deleting}
                onClick={handleDeleteTeam}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:pointer-events-none transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                {deleting ? "Deleting…" : "Delete Team"}
              </button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
