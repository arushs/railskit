import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { api } from "@/lib/api";

export interface User {
  id: number;
  email: string;
  name: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ user: User }>("/api/auth/me")
      .then(({ data, ok }) => {
        if (ok && data.user) setUser(data.user);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data, ok } = await api.post<{ user: User }>("/api/auth/login", {
      user: { email, password },
    });
    if (!ok) throw new Error((data as unknown as { error: string }).error || "Login failed");
    setUser(data.user);
  }, []);

  const signup = useCallback(async (email: string, password: string, name: string) => {
    const { data, ok } = await api.post<{ user: User }>("/api/auth/signup", {
      user: { email, password, name },
    });
    if (!ok) throw new Error((data as unknown as { error: string }).error || "Signup failed");
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    await api.delete("/api/auth/logout");
    setUser(null);
  }, []);

  const updateUser = useCallback((data: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...data } : null));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
