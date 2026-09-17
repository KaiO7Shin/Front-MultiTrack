import { isValidEmail, isValidPhone } from "../lib/utils";
import type { PublicUser, Result } from "../types";

export type RegisterInput = {
  username: string;
  email: string;
  phone: string;
  password: string;
  passwordConfirmation: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type ProfileInput = {
  username: string;
  email: string;
  phone: string;
  password: string;
  passwordConfirmation: string;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

/**
 * Auth prototype (session navigateur).
 * Remplacer par `apiRequest(API.register)`, `API.login` et `API.me`
 * lorsque le compte public sera branché sur le backend.
 */
export function registerAccount(input: RegisterInput): Result<PublicUser> {
  const username = input.username.trim();
  const email = normalizeEmail(input.email);
  const phone = input.phone.trim();
  const password = input.password;

  if (username.length < 2) {
    return { ok: false, error: "Saisissez un nom d’utilisateur." };
  }
  if (!isValidEmail(email)) {
    return { ok: false, error: "Saisissez une adresse e-mail valide." };
  }
  if (!isValidPhone(phone)) {
    return { ok: false, error: "Saisissez un numéro de téléphone valide." };
  }
  if (password.length < 8) {
    return { ok: false, error: "Le mot de passe doit contenir au moins 8 caractères." };
  }
  if (password !== input.passwordConfirmation) {
    return { ok: false, error: "Les deux mots de passe sont différents." };
  }

  return {
    ok: true,
    data: {
      username,
      email,
      phone,
      password,
    },
  };
}

export function loginAccount(user: PublicUser | null, input: LoginInput): Result<PublicUser> {
  const email = normalizeEmail(input.email);

  if (!isValidEmail(email)) {
    return { ok: false, error: "Saisissez une adresse e-mail valide." };
  }
  if (!user || user.email !== email || user.password !== input.password) {
    return { ok: false, error: "Compte fictif introuvable ou mot de passe incorrect." };
  }

  return { ok: true, data: user };
}

export function updateAccount(user: PublicUser, input: ProfileInput): Result<PublicUser> {
  const username = input.username.trim();
  const email = normalizeEmail(input.email);
  const phone = input.phone.trim();
  const password = input.password;

  if (username.length < 2) {
    return { ok: false, error: "Saisissez un nom d’utilisateur." };
  }
  if (!isValidEmail(email)) {
    return { ok: false, error: "Saisissez une adresse e-mail valide." };
  }
  if (!isValidPhone(phone)) {
    return { ok: false, error: "Saisissez un numéro de téléphone valide." };
  }
  if (password && (password.length < 8 || password !== input.passwordConfirmation)) {
    return {
      ok: false,
      error: "Le nouveau mot de passe doit contenir 8 caractères et les deux saisies doivent correspondre.",
    };
  }

  return {
    ok: true,
    data: {
      username,
      email,
      phone,
      password: password || user.password,
    },
  };
}
