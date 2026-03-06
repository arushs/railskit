import { cn } from "@/lib/utils";

const roleStyles: Record<string, string> = {
  owner: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  admin: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  member: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  viewer: "bg-zinc-700/15 text-zinc-500 border-zinc-700/30",
};

export function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize",
        roleStyles[role] || roleStyles.member
      )}
    >
      {role}
    </span>
  );
}
