export { API } from "./endpoints";

const TOKEN_KEY = "multitrack_token";

let attachStoredToken = true;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

/** Public site: httpOnly cookie only. Organizer still attaches a stored Bearer token. */
export function setAttachStoredToken(enabled: boolean): void {
  attachStoredToken = enabled;
}

function storedBearerToken(): string | null {
  return attachStoredToken ? getToken() : null;
}

function url(path: string): string {
  const base = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";
  if (base.endsWith("/api") && path.startsWith("/api/")) {
    return `${base}${path.slice(4)}`;
  }
  return `${base}${path}`;
}

/** Même base que `apiRequest` (`VITE_API_URL`). */
export function apiUrl(path: string): string {
  return url(path);
}

async function errorMessage(response: Response): Promise<string> {
  const fallback = `La requête a échoué (${response.status})`;
  try {
    const body = (await response.json()) as { message?: string; error?: string };
    return body.message ?? body.error ?? fallback;
  } catch {
    return fallback;
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = storedBearerToken();
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(url(path), {
    ...options,
    headers,
    credentials: options.credentials ?? "include",
  });
  if (!response.ok) throw new ApiError(await errorMessage(response), response.status);
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function downloadAuthenticated(
  path: string,
  filename: string,
): Promise<void> {
  const token = storedBearerToken();
  const response = await fetch(url(path), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: "include",
  });
  if (!response.ok) throw new ApiError(await errorMessage(response), response.status);

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(objectUrl);
}

export function listFrom<T>(payload: T[] | { data?: T[] }): T[] {
  return Array.isArray(payload) ? payload : payload.data ?? [];
}

export function unwrapData<T>(payload: T | { data: T }): T {
  return payload !== null && typeof payload === "object" && "data" in payload
    ? (payload as { data: T }).data
    : payload;
}

export function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Une erreur inattendue est survenue.";
}
