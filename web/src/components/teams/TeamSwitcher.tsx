import { useState, useRef, useEffect } from "react";
import { useTeam } from "@/contexts/TeamContext";
import { ChevronDown, Plus, Check, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export function TeamSwitcher() {
  const { teams, currentTeam, switchTeam, createTeam } = useTeam();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setCreating(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const team = await createTeam(newName.trim());
    if (team) {
      switchTeam(team);
      setNewName("");
      setCreating(false);
      setOpen(false);
    }
  };

  if (!currentTeam) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
      >
        <Users className="h-4 w-4 text-zinc-500" />
        <span className="max-w-[120px] truncate">{currentTeam.name}</span>
        <ChevronDown className={cn("h-3 w-3 text-zinc-500 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-lg border border-zinc-800 bg-zinc-900 p-1 shadow-xl">
          <div className="px-2 py-1.5 text-xs font-medium text-zinc-500 uppercase tracking-wider">Teams</div>
          {teams.map((team) => (
            <button
              key={team.id}
              onClick={() => {
                switchTeam(team);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded bg-zinc-800 text-xs font-bold text-zinc-400">
                {team.name.charAt(0).toUpperCase()}
              </div>
              <span className="flex-1 truncate text-left">{team.name}</span>
              {team.id === currentTeam.id && <Check className="h-4 w-4 text-emerald-400" />}
            </button>
          ))}

          <div className="my-1 border-t border-zinc-800" />

          {creating ? (
            <div className="p-2">
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                placeholder="Team name..."
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
              />
              <div className="mt-2 flex gap-2">
                <button
                  onClick={handleCreate}
                  className="flex-1 rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setCreating(false);
                    setNewName("");
                  }}
                  className="rounded-md px-3 py-1 text-xs text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setCreating(true)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create team
            </button>
          )}
        </div>
      )}
    </div>
  );
}
