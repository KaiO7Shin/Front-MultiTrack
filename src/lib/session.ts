/** Clés de persistance session back-office. */
export const SESSION_TOKEN_KEY = "mt_bo_token";
export const SESSION_USER_KEY = "mt_bo_user";

/** Anciennes clés — nettoyées au boot pour éviter les sessions orphelines. */
const LEGACY_TOKEN_KEY = "token";
const LEGACY_USER_KEY = "user";

export type JwtPayload = {
  exp?: number;
  uid?: number;
  role?: string | number;
  name?: string;
  kind?: string;
  sub?: string;
};

/** Décode le payload JWT (sans vérifier la signature — le serveur la vérifie). */
export function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const json = atob(padded);
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

export function isJwtExpired(token: string, skewSeconds = 30): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return true;
  const now = Math.floor(Date.now() / 1000);
  return payload.exp <= now + skewSeconds;
}

export function isJwtStructurallyValid(token: string): boolean {
  if (!token || token.startsWith("static-")) return false;
  const payload = decodeJwtPayload(token);
  return Boolean(payload && typeof payload.exp === "number");
}

export function readStoredToken(): string | null {
  return (
    localStorage.getItem(SESSION_TOKEN_KEY) ??
    localStorage.getItem(LEGACY_TOKEN_KEY)
  );
}

export function readStoredUserJson(): string | null {
  return (
    localStorage.getItem(SESSION_USER_KEY) ??
    localStorage.getItem(LEGACY_USER_KEY)
  );
}

export function persistSession(token: string, userJson: string) {
  localStorage.setItem(SESSION_TOKEN_KEY, token);
  localStorage.setItem(SESSION_USER_KEY, userJson);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
  localStorage.removeItem(LEGACY_USER_KEY);
}

export function clearSessionStorage() {
  localStorage.removeItem(SESSION_TOKEN_KEY);
  localStorage.removeItem(SESSION_USER_KEY);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
  localStorage.removeItem(LEGACY_USER_KEY);
}

/**
 * Session restaurable : token JWT non expiré + user JSON cohérent.
 * Si le rôle stocké diverge du claim JWT, on privilégie le claim.
 */
export function loadValidSession<T extends { id: number; role: number }>(
  mapRoleFromJwt: (role: string | number | undefined) => number | null,
  hydrateUser: (raw: T, jwt: JwtPayload) => T
): { token: string; user: T } | null {
  const token = readStoredToken();
  const userJson = readStoredUserJson();
  if (!token || !userJson) {
    clearSessionStorage();
    return null;
  }
  if (!isJwtStructurallyValid(token) || isJwtExpired(token)) {
    clearSessionStorage();
    return null;
  }

  try {
    const raw = JSON.parse(userJson) as T;
    const jwt = decodeJwtPayload(token)!;
    const jwtRole = mapRoleFromJwt(jwt.role);
    if (jwtRole != null && raw.role !== jwtRole) {
      raw.role = jwtRole as T["role"];
    }
    if (jwt.uid != null && Number(raw.id) !== Number(jwt.uid)) {
      clearSessionStorage();
      return null;
    }
    const user = hydrateUser(raw, jwt);
    persistSession(token, JSON.stringify(user));
    return { token, user };
  } catch {
    clearSessionStorage();
    return null;
  }
}
