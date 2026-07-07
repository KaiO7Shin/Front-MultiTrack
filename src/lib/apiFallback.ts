import { API_STRICT_MODE, FORCE_LOCAL_DATA } from "./apiMode";

type ApiError = {
  response?: { status?: number };
  code?: string;
};

/** Erreur réseau ou endpoint non déployé → fallback mock autorisé */
export function isApiUnavailable(error: unknown): boolean {
  const err = error as ApiError;
  const status = err?.response?.status;
  if (status === 404 || status === 501 || status === 502 || status === 503) {
    return true;
  }
  if (!status && (err as ApiError)?.code === "ERR_NETWORK") return true;
  return false;
}

export type ApiOrLocalOptions = {
  /** Label pour les logs (ex. "GET /phases") */
  label?: string;
  /** Si true, ne pas fallback en cas d'erreur métier (400, 409…) */
  allowFallback?: boolean;
};

/**
 * Lecture : API d'abord en mode hybride, mock local si endpoint absent.
 * Écriture : idem — persiste en local si l'API n'existe pas encore.
 */
export async function apiOrLocal<T>(
  apiCall: () => Promise<T>,
  localCall: () => T | Promise<T>,
  options?: ApiOrLocalOptions
): Promise<T> {
  if (FORCE_LOCAL_DATA) {
    return localCall();
  }

  if (API_STRICT_MODE) {
    return apiCall();
  }

  try {
    return await apiCall();
  } catch (error) {
    const canFallback = options?.allowFallback !== false && isApiUnavailable(error);
    if (canFallback) {
      if (import.meta.env.DEV) {
        console.info(
          `[MultiTrack] Fallback local${options?.label ? ` (${options.label})` : ""}`
        );
      }
      return localCall();
    }
    throw error;
  }
}

/** Écriture : tente l'API, sinon local (jamais en mode strict sans API) */
export async function apiWriteOrLocal<T>(
  apiCall: () => Promise<T>,
  localCall: () => T | Promise<T>,
  label?: string
): Promise<T> {
  return apiOrLocal(apiCall, localCall, { label, allowFallback: true });
}
