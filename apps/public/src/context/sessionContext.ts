import { createContext } from "react";
import type { LoginInput, ProfileInput, RegisterInput } from "../services/authService";
import type { PublicUser, Registration, Result } from "../types";

export type SessionContextValue = {
  user: PublicUser | null;
  authenticated: boolean;
  sessionReady: boolean;
  registrations: Registration[];
  register: (input: RegisterInput) => Promise<Result<PublicUser>>;
  login: (input: LoginInput) => Promise<Result<PublicUser>>;
  logout: () => Promise<void>;
  updateProfile: (input: ProfileInput) => Result<PublicUser>;
  addRegistration: (registration: Registration) => void;
};

export const SessionContext = createContext<SessionContextValue | null>(null);
