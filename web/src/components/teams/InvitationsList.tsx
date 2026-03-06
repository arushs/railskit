import { teamsApi, type TeamInvitation } from "@/lib/teams-api";
import { RoleBadge } from "./RoleBadge";
import { X, Clock } from "lucide-react";

interface InvitationsListProps {
  teamId: number;
  invitations: TeamInvitation[];
  onUpdate: () => void;
}

export function InvitationsList({ teamId, invitations, onUpdate }: InvitationsListProps) {
  const handleCancel = async (id: number) => {
    await teamsApi.cancelInvitation(teamId, id);
    onUpdate();
  };

  if (invitations.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-800 py-6 text-center text-sm text-zinc-500">
        No pending invitations
      </div>
    );
  }

  return (
    <div className="divide-y divide-zinc-800 rounded-lg border border-zinc-800">
      {invitations.map((inv) => (
        <div key={inv.id} className="flex items-center gap-3 px-4 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-sm text-zinc-400">
            {inv.email.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">{inv.email}</div>
            <div className="flex items-center gap-1 text-xs text-zinc-500">
              <Clock className="h-3 w-3" />
              Expires {new Date(inv.expires_at).toLocaleDateString()}
            </div>
          </div>
          <RoleBadge role={inv.role} />
          <button
            onClick={() => handleCancel(inv.id)}
            className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-red-400"
            title="Cancel invitation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
