import { createContext } from "react";
import type { LoginInput, ProfileInput, RegisterInput } from "../services/authService";
import type { PublicUser, Registration, Result } from "../types";

export type SessionContextValue = {
  user: PublicUser | null;
  authenticated: boolean;
  registrations: Registration[];
  register: (input: RegisterInput) => Result<PublicUser>;
  login: (input: LoginInput) => Result<PublicUser>;
  logout: () => void;
  updateProfile: (input: ProfileInput) => Result<PublicUser>;
  addRegistration: (registration: Registration) => void;
};

export const SessionContext = createContext<SessionContextValue | null>(null);
