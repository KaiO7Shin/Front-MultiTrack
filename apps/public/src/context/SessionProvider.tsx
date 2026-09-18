import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  fetchCurrentAccount,
  loginAccount,
  logoutAccount,
  registerAccount,
  updateAccount,
} from "../services/authService";
import { clearRegistrationDraft } from "../lib/registrationDraftStorage";
import { listMyRegistrations } from "../services/registrationService";
import type { LoginInput, ProfileInput, RegisterInput } from "../services/authService";
import type { PublicUser, Registration, Result } from "../types";
import { SessionContext } from "./sessionContext";

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [registrations, setRegistrations] = useState<Registration[]>([]);

  const loadRegistrations = useCallback(async () => {
    try {
      setRegistrations(await listMyRegistrations());
    } catch {
      setRegistrations([]);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetchCurrentAccount()
      .then(async (account) => {
        if (cancelled) return;
        if (account) {
          setUser(account);
          setAuthenticated(true);
          try {
            const items = await listMyRegistrations();
            if (!cancelled) setRegistrations(items);
          } catch {
            if (!cancelled) setRegistrations([]);
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUser(null);
          setAuthenticated(false);
        }
      })
      .finally(() => {
        if (!cancelled) setSessionReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function register(input: RegisterInput): Promise<Result<PublicUser>> {
    const result = await registerAccount(input);
    if (!result.ok) return result;
    setUser(result.data);
    setAuthenticated(true);
    await loadRegistrations();
    return result;
  }

  async function login(input: LoginInput): Promise<Result<PublicUser>> {
    const result = await loginAccount(input);
    if (!result.ok) return result;
    setUser(result.data);
    setAuthenticated(true);
    await loadRegistrations();
    return result;
  }

  async function logout() {
    await logoutAccount();
    // Démonter l’espace connecté avant de vider le brouillon, sinon la
    // sauvegarde différée du wizard peut le réécrire juste après.
    setAuthenticated(false);
    setUser(null);
    setRegistrations([]);
    await clearRegistrationDraft();
  }

  async function updateProfile(input: ProfileInput) {
    const result = await updateAccount(input);
    if (!result.ok) return result;
    setUser(result.data);
    return result;
  }

  function addRegistration(registration: Registration) {
    setRegistrations((current) => [
      registration,
      ...current.filter((item) => item.id !== registration.id),
    ]);
  }

  return (
    <SessionContext.Provider
      value={{
        user,
        authenticated,
        sessionReady,
        registrations,
        loadRegistrations,
        register,
        login,
        logout,
        updateProfile,
        addRegistration,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}
