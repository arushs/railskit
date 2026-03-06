import { useState } from "react";
import { teamsApi, type TeamMember } from "@/lib/teams-api";
import { RoleBadge } from "./RoleBadge";
import { MoreHorizontal, UserMinus, Shield } from "lucide-react";

interface MembersListProps {
  teamId: number;
  members: TeamMember[];
  currentUserRole: string;
  onUpdate: () => void;
}

const ROLES = ["admin", "member", "viewer"] as const;

export function MembersList({ teamId, members, currentUserRole, onUpdate }: MembersListProps) {
  const [menuOpen, setMenuOpen] = useState<number | null>(null);
  const canManage = currentUserRole === "owner" || currentUserRole === "admin";

  const handleRoleChange = async (membershipId: number, role: string) => {
    await teamsApi.updateMemberRole(teamId, membershipId, role);
    setMenuOpen(null);
    onUpdate();
  };

  const handleRemove = async (membershipId: number) => {
    if (!confirm("Remove this member from the team?")) return;
    await teamsApi.removeMember(teamId, membershipId);
    setMenuOpen(null);
    onUpdate();
  };

  return (
    <div className="divide-y divide-zinc-800 rounded-lg border border-zinc-800">
      {members.map((m) => (
        <div key={m.id} className="flex items-center gap-3 px-4 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-sm font-medium text-zinc-300">
            {m.user.avatar_url ? (
              <img src={m.user.avatar_url} alt="" className="h-8 w-8 rounded-full" />
            ) : (
              m.user.name?.charAt(0)?.toUpperCase() || m.user.email.charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">{m.user.name || "Unnamed"}</div>
            <div className="text-xs text-zinc-500 truncate">{m.user.email}</div>
          </div>
          <RoleBadge role={m.role} />

          {canManage && m.role !== "owner" && (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(menuOpen === m.id ? null : m.id)}
                className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-white"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
              {menuOpen === m.id && (
                <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-lg border border-zinc-800 bg-zinc-900 p-1 shadow-xl">
                  <div className="px-2 py-1 text-xs font-medium text-zinc-500">Change role</div>
                  {ROLES.map((role) => (
                    <button
                      key={role}
                      onClick={() => handleRoleChange(m.id, role)}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800 capitalize"
                    >
                      <Shield className="h-3 w-3" />
                      {role}
                    </button>
                  ))}
                  <div className="my-1 border-t border-zinc-800" />
                  <button
                    onClick={() => handleRemove(m.id)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-red-400 hover:bg-red-500/10"
                  >
                    <UserMinus className="h-3 w-3" />
                    Remove
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
