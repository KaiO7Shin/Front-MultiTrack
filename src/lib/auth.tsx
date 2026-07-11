import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import apiClient from "./api";
import { API } from "./apiEndpoints";
import { Navigate, useLocation } from "react-router-dom";
import { PageLoading } from "@/components/ui/feedback";

export type Role = "admin" | "inscriptions" | "checkpoint" | "arrival";

/** Utilisateur de session tel que renvoyé par l'API login */
export type SessionUser = {
  id: number;
  role: number;
  assignedControlPoint?: {
    id: number;
    courseId?: number;
    label: string;
    controlPointNumber?: number;
  };
  point_de_controle_course_id?: number | null;
  name?: string | null;
};

export const ROLE_ADMIN = 0;
export const ROLE_CHECKPOINT = 1;

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

  useEffect(() => {
    try {
      const t = localStorage.getItem("token");
      const u = localStorage.getItem("user");
      if (t && u) {
        setToken(t);
        setUser(JSON.parse(u) as SessionUser);
      }
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } finally {
      setLoading(false);
    }
  }, []);

  async function signIn(passcode: string) {
    setLoading(true);
    try {
      const res = await apiClient.post<{
        data: { token: string; user: SessionUser };
      }>(API.login, { passcode });

      const { token, user } = res.data.data;
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
  const location = useLocation();

  if (loading) return <PageLoading message="Vérification de la session…" />;
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
}

export function RequireRole({
  role,
  children,
}: {
  role: number | number[];
  children: React.ReactElement;
}) {
  const { user } = useAuth();
  const userRole = user?.role;
  const allowed = Array.isArray(role)
    ? role.includes(userRole ?? -1)
    : userRole === role;
  if (!allowed) return <div className="p-6 text-sm text-red-600">Accès refusé.</div>;
  return children;
}
