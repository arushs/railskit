import { createContext, useCallback, useEffect, useState, type ReactNode } from "react";
import { authApi, type User, type TwoFactorChallengeResponse } from "../lib/api";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  twoFactorPending: { tempToken: string } | null;
  signUp: (email: string, password: string, name?: string) => Promise<{ ok: boolean; error?: string; confirmationRequired?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ ok: boolean; error?: string; requires2fa?: boolean }>;
  completeTwoFactor: (otpCode: string) => Promise<{ ok: boolean; error?: string }>;
  cancelTwoFactor: () => void;
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
  const [twoFactorPending, setTwoFactorPending] = useState<{ tempToken: string } | null>(null);

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
      const data = res.data as Record<string, unknown>;
      if (data.confirmation_required) {
        return { ok: true, confirmationRequired: true };
      }
      setUser(res.data.user);
      return { ok: true };
    }
    const errorData = res.data as unknown as { details?: string[] };
    return { ok: false, error: errorData.details?.join(", ") || "Sign up failed" };
  };

  const signIn = async (email: string, password: string) => {
    const res = await authApi.signIn(email, password);
    if (res.ok) {
      const data = res.data as unknown as TwoFactorChallengeResponse | { user: User };
      if ("requires_2fa" in data && data.requires_2fa) {
        setTwoFactorPending({ tempToken: data.temp_token });
        return { ok: true, requires2fa: true };
      }
      setUser((data as { user: User }).user);
      return { ok: true };
    }
    const errorData = res.data as unknown as { error?: string };
    return { ok: false, error: errorData.error || "Invalid credentials" };
  };

  const completeTwoFactor = async (otpCode: string) => {
    if (!twoFactorPending) {
      return { ok: false, error: "No 2FA challenge pending" };
    }
    const res = await authApi.twoFactor.challenge(twoFactorPending.tempToken, otpCode);
    if (res.ok) {
      setUser(res.data.user);
      setTwoFactorPending(null);
      return { ok: true };
    }
    const errorData = res.data as unknown as { error?: string };
    return { ok: false, error: errorData.error || "Invalid code" };
  };

  const cancelTwoFactor = () => {
    setTwoFactorPending(null);
  };

  const signOut = async () => {
    await authApi.signOut();
    setUser(null);
    setTwoFactorPending(null);
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
      value={{
        user,
        loading,
        twoFactorPending,
        signUp,
        signIn,
        completeTwoFactor,
        cancelTwoFactor,
        signOut,
        requestMagicLink,
        verifyMagicLink,
        updateProfile,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
