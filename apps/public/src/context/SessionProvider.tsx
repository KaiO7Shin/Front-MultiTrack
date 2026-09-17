import { useEffect, useState, type ReactNode } from "react";
import {
  fetchCurrentAccount,
  loginAccount,
  logoutAccount,
  registerAccount,
  updateAccount,
} from "../services/authService";
import type { LoginInput, ProfileInput, RegisterInput } from "../services/authService";
import type { PublicUser, Registration, Result } from "../types";
import { SessionContext } from "./sessionContext";

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [registrations, setRegistrations] = useState<Registration[]>([]);

  useEffect(() => {
    let cancelled = false;

    fetchCurrentAccount()
      .then((account) => {
        if (cancelled) return;
        if (account) {
          setUser(account);
          setAuthenticated(true);
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
    return result;
  }

  async function login(input: LoginInput): Promise<Result<PublicUser>> {
    const result = await loginAccount(input);
    if (!result.ok) return result;
    setUser(result.data);
    setAuthenticated(true);
    return result;
  }

  async function logout() {
    await logoutAccount();
    setAuthenticated(false);
    setUser(null);
  }

  function updateProfile(input: ProfileInput) {
    if (!user) return { ok: false, error: "Aucun compte n’est disponible dans cette session." } as const;
    const result = updateAccount(user, input);
    if (!result.ok) return result;
    setUser(result.data);
    return result;
  }

  function addRegistration(registration: Registration) {
    setRegistrations((current) => [registration, ...current]);
  }

  return (
    <SessionContext.Provider
      value={{
        user,
        authenticated,
        sessionReady,
        registrations,
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
