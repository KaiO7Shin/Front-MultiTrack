import { useState, type ReactNode } from "react";
import { loginAccount, registerAccount, updateAccount } from "../services/authService";
import type { LoginInput, ProfileInput, RegisterInput } from "../services/authService";
import type { PublicUser, Registration } from "../types";
import { SessionContext } from "./sessionContext";

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [registrations, setRegistrations] = useState<Registration[]>([]);

  function register(input: RegisterInput) {
    const result = registerAccount(input);
    if (!result.ok) return result;
    setUser(result.data);
    setAuthenticated(true);
    return result;
  }

  function login(input: LoginInput) {
    const result = loginAccount(user, input);
    if (!result.ok) return result;
    setAuthenticated(true);
    return result;
  }

  function logout() {
    setAuthenticated(false);
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
