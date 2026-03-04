import { createContext, useCallback, useEffect, useState, type ReactNode } from "react";
import { authApi, type User } from "../lib/api";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, name?: string) => Promise<{ ok: boolean; error?: string }>;
  signIn: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => Promise<void>;
  requestMagicLink: (email: string) => Promise<{ ok: boolean }>;
  verifyMagicLink: (token: string) => Promise<{ ok: boolean; error?: string }>;
  updateProfile: (data: { name?: string; avatar_url?: string }) => Promise<{ ok: boolean }>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const res = await authApi.me();
      if (res.ok) {
        setUser(res.data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  const signUp = async (email: string, password: string, name?: string) => {
    const res = await authApi.signUp(email, password, name);
    if (res.ok) {
      setUser(res.data.user);
      return { ok: true };
    }
    const errorData = res.data as unknown as { details?: string[] };
    return { ok: false, error: errorData.details?.join(", ") || "Sign up failed" };
  };

  const signIn = async (email: string, password: string) => {
    const res = await authApi.signIn(email, password);
    if (res.ok) {
      setUser(res.data.user);
      return { ok: true };
    }
    const errorData = res.data as unknown as { error?: string };
    return { ok: false, error: errorData.error || "Invalid credentials" };
  };

  const signOut = async () => {
    await authApi.signOut();
    setUser(null);
  };

  const requestMagicLink = async (email: string) => {
    const res = await authApi.requestMagicLink(email);
    return { ok: res.ok };
  };

  const verifyMagicLink = async (token: string) => {
    const res = await authApi.verifyMagicLink(token);
    if (res.ok) {
      setUser(res.data.user);
      return { ok: true };
    }
    const errorData = res.data as unknown as { error?: string };
    return { ok: false, error: errorData.error || "Invalid magic link" };
  };

  const updateProfile = async (data: { name?: string; avatar_url?: string }) => {
    const res = await authApi.updateProfile(data);
    if (res.ok) {
      setUser(res.data.user);
      return { ok: true };
    }
    return { ok: false };
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, signUp, signIn, signOut, requestMagicLink, verifyMagicLink, updateProfile, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}
