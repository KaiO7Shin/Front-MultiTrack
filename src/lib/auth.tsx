import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { PageLoading } from "@/components/ui/feedback";
import { demoCheckpointSession } from "@/data/staticStore";
import api from "@/lib/api";
import { API } from "@/lib/apiEndpoints";
import {
  clearSessionStorage,
  decodeJwtPayload,
  loadValidSession,
  persistSession,
} from "@/lib/session";
import type { AssignedManche, RenderResponse } from "@/lib/type";

/** Utilisateur de session tel que renvoyé par l'API login */
export type SessionUser = {
  id: number;
  role: number;
  libelle?: string | null;
  assignedControlPoint?: {
    id: number;
    courseId?: number;
    label: string;
    controlPointNumber?: number;
  };
  assignedManches?: AssignedManche[];
  point_de_controle_course_id?: number | null;
  name?: string | null;
};

export const ROLE_ADMIN = 0;
export const ROLE_CHECKPOINT = 1;
export const ROLE_ORGANIZER = 2;

type LoginPayload = {
  token: string;
  user: { id: number; role: number };
};

function roleLabel(role: number) {
  if (role === ROLE_CHECKPOINT) return "Pointeur";
  if (role === ROLE_ORGANIZER) return "Organisateur";
  if (role === ROLE_ADMIN) return "Administrateur";
  return "Utilisateur";
}

/** Mappe le claim JWT (ADMIN / ORGANIZER / …) ou un code numérique. */
export function mapJwtRoleToCode(role: string | number | undefined): number | null {
  if (role == null) return null;
  if (typeof role === "number" && Number.isFinite(role)) return role;
  const normalized = String(role).trim().toUpperCase().replace(/^ROLE_/, "");
  if (normalized === "ADMIN" || normalized === "0") return ROLE_ADMIN;
  if (
    normalized === "CHECKPOINT" ||
    normalized === "POINTEUR" ||
    normalized === "1"
  ) {
    return ROLE_CHECKPOINT;
  }
  if (normalized === "ORGANIZER" || normalized === "ORGANISATEUR" || normalized === "2") {
    return ROLE_ORGANIZER;
  }
  return null;
}

export function homePathForRole(role: number | undefined) {
  if (role === ROLE_CHECKPOINT) return "/checkpoint/scan";
  if (role === ROLE_ORGANIZER) return "/participants";
  return "/dashboard";
}

type AuthContextType = {
  user: SessionUser | null;
  token: string | null;
  loading: boolean;
  signIn: (passcode: string) => Promise<SessionUser>;
  signOut: () => void;
};

const AuthCtx = createContext<AuthContextType | null>(null);

function buildSessionUser(
  id: number,
  role: number,
  extras?: Partial<SessionUser>
): SessionUser {
  const label = roleLabel(role);
  const checkpoint =
    role === ROLE_CHECKPOINT ? demoCheckpointSession() : null;
  return {
    id,
    role,
    name: extras?.name ?? label,
    libelle: extras?.libelle ?? checkpoint?.libelle ?? label,
    assignedControlPoint:
      extras?.assignedControlPoint ?? checkpoint?.assignedControlPoint,
    assignedManches: extras?.assignedManches ?? checkpoint?.assignedManches ?? [],
    point_de_controle_course_id: extras?.point_de_controle_course_id,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restored = loadValidSession<SessionUser>(mapJwtRoleToCode, (raw, jwt) =>
      buildSessionUser(Number(raw.id), Number(raw.role), {
        ...raw,
        name: raw.name ?? jwt.name ?? undefined,
      })
    );
    if (restored) {
      setToken(restored.token);
      setUser(restored.user);
    } else {
      setToken(null);
      setUser(null);
    }
    setLoading(false);
  }, []);

  // Expire la session côté client quand le JWT arrive à échéance.
  useEffect(() => {
    if (!token) return;
    const payload = decodeJwtPayload(token);
    if (!payload?.exp) return;

    const ms = payload.exp * 1000 - Date.now();
    if (ms <= 0) {
      setUser(null);
      setToken(null);
      clearSessionStorage();
      if (window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
      return;
    }
    const timer = window.setTimeout(() => {
      setUser(null);
      setToken(null);
      clearSessionStorage();
      if (window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
    }, ms);
    return () => window.clearTimeout(timer);
  }, [token]);

  async function signIn(passcode: string) {
    setLoading(true);
    try {
      const { data } = await api.post<RenderResponse<LoginPayload>>(API.login, {
        passcode: passcode.trim(),
      });
      if (!data?.data?.token || data.data.user == null) {
        throw new Error(data?.message || "Authentification échouée");
      }

      const sessionToken = data.data.token;
      const apiRole = Number(data.data.user.role);
      const jwt = decodeJwtPayload(sessionToken);
      const jwtRole = mapJwtRoleToCode(jwt?.role);
      // Le claim JWT fait foi s’il est présent (évite un mauvais code numérique en base).
      const role = jwtRole ?? apiRole;
      if (![ROLE_ADMIN, ROLE_CHECKPOINT, ROLE_ORGANIZER].includes(role)) {
        throw new Error("Rôle utilisateur non reconnu");
      }

      const sessionUser = buildSessionUser(Number(data.data.user.id), role);

      setToken(sessionToken);
      setUser(sessionUser);
      persistSession(sessionToken, JSON.stringify(sessionUser));
      return sessionUser;
    } finally {
      setLoading(false);
    }
  }

  function signOut() {
    setUser(null);
    setToken(null);
    clearSessionStorage();
  }

  const value = useMemo(
    () => ({ user, token, loading, signIn, signOut }),
    [user, token, loading]
  );
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
  if (!allowed) {
    return <Navigate to={homePathForRole(userRole)} replace />;
  }
  return children;
}

export function RoleHomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={homePathForRole(user?.role)} replace />;
}
