import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import apiClient from "./api";

export type Role = "admin" | "inscriptions" | "checkpoint" | "arrival";
export type SessionUser = {
  id: number;
  role: Role;
  point_de_controle_course_id?: number | null;
  name?: string | null;
};

type AuthContextType = {
  user: SessionUser | null;
  token: string | null;
  loading: boolean;
  signIn: (passcode: string) => Promise<void>;
  signOut: () => void;
};

const AuthCtx = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // restore from storage
  useEffect(() => {
    const t = localStorage.getItem("token");
    const u = localStorage.getItem("user");
    if (t && u) {
      setToken(t);
      setUser(JSON.parse(u));
    }
    setLoading(false);
  }, []);

  async function signIn(passcode: string) {
    setLoading(true);
    try {
        const res = await apiClient.post<{ token: string; user: SessionUser }>(
        "/api/auth/login",
        { passcode }
        );

        const { token, user } = res.data;
        setToken(token);
        setUser(user);

        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
    } finally {
        setLoading(false);
    }
  }

  function signOut() {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }

  const value = useMemo(() => ({ user, token, loading, signIn, signOut }), [user, token, loading]);
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function RequireAuth({ children }: { children: React.ReactElement }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-6 text-sm text-slate-500">Chargement…</div>;
  if (!user) {
    window.location.href = "/login";
    return null;
  }
  return children;
}

export function RequireRole({
  role,
  children,
}: {
  role: Role | Role[];
  children: React.ReactElement;
}) {
  const { user } = useAuth();
  const allowed = Array.isArray(role) ? role.includes(user?.role as Role) : user?.role === role;
  if (!allowed) return <div className="p-6 text-sm text-red-600">Accès refusé.</div>;
  return children;
}
