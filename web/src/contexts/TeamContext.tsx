import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { teamsApi, type Team } from "@/lib/teams-api";
import { useAuth } from "@/hooks/useAuth";

interface TeamContextValue {
  teams: Team[];
  currentTeam: Team | null;
  loading: boolean;
  switchTeam: (team: Team) => void;
  createTeam: (name: string) => Promise<Team | null>;
  refreshTeams: () => Promise<void>;
}

const TeamContext = createContext<TeamContextValue | null>(null);

export function TeamProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshTeams = useCallback(async () => {
    if (!user) return;
    try {
      const res = await teamsApi.list();
      if (res.ok) {
        setTeams(res.data);
        // Restore saved team or default to first
        const savedId = localStorage.getItem("railskit_current_team");
        const saved = savedId ? res.data.find((t) => t.id === Number(savedId)) : null;
        setCurrentTeam(saved || res.data[0] || null);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshTeams();
  }, [refreshTeams]);

  const switchTeam = useCallback((team: Team) => {
    setCurrentTeam(team);
    localStorage.setItem("railskit_current_team", String(team.id));
  }, []);

  const createTeam = useCallback(
    async (name: string): Promise<Team | null> => {
      const res = await teamsApi.create(name);
      if (res.ok) {
        await refreshTeams();
        return res.data;
      }
      return null;
    },
    [refreshTeams]
  );

  return (
    <TeamContext.Provider value={{ teams, currentTeam, loading, switchTeam, createTeam, refreshTeams }}>
      {children}
    </TeamContext.Provider>
  );
}

export function useTeam() {
  const ctx = useContext(TeamContext);
  if (!ctx) throw new Error("useTeam must be used within TeamProvider");
  return ctx;
}
