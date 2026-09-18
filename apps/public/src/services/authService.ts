import { API, ApiError, apiRequest, clearToken, setAttachStoredToken, toErrorMessage } from "@multitrack/api-client";
import type { Account, AuthResponse, RenderResponse } from "@multitrack/types";
import { isValidEmail, isValidPhone } from "../lib/utils";
import type { PublicUser, Result } from "../types";

setAttachStoredToken(false);

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

function renderError(error: unknown, fallback: string) {
  if (error instanceof ApiError && error.message.trim()) {
    return error.message;
  }
  const message = toErrorMessage(error).trim();
  return message || fallback;
}

function accountToUser(account: Account): PublicUser {
  return {
    username: account.username?.trim() || account.email,
    email: account.email,
    phone: account.phone ?? "",
  };
}

function readAuthAccount(payload: RenderResponse<AuthResponse>, fallback: string): PublicUser {
  if (payload.code !== 200) {
    throw new ApiError(payload.message?.trim() || payload.error?.trim() || fallback, payload.code);
  }
  const account = payload.data?.account;
  if (!account?.email) {
    throw new ApiError(fallback, payload.code);
  }
  return accountToUser(account);
}

export function validateRegisterInput(input: RegisterInput): Result<RegisterInput> {
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

  return { ok: true, data: { ...input, username, email, phone, password } };
}

export function validateLoginInput(input: LoginInput): Result<LoginInput> {
  const email = normalizeEmail(input.email);
  if (!isValidEmail(email)) {
    return { ok: false, error: "Saisissez une adresse e-mail valide." };
  }
  if (!input.password) {
    return { ok: false, error: "Saisissez votre mot de passe." };
  }
  return { ok: true, data: { email, password: input.password } };
}

export async function registerAccount(input: RegisterInput): Promise<Result<PublicUser>> {
  const validation = validateRegisterInput(input);
  if (!validation.ok) return validation;

  try {
    const payload = await apiRequest<RenderResponse<AuthResponse>>(API.register, {
      method: "POST",
      body: JSON.stringify({
        username: validation.data.username,
        email: validation.data.email,
        password: validation.data.password,
        phone: validation.data.phone,
      }),
    });
    return { ok: true, data: readAuthAccount(payload, "Impossible de créer le compte.") };
  } catch (error) {
    return { ok: false, error: renderError(error, "Impossible de créer le compte.") };
  }
}

export async function loginAccount(input: LoginInput): Promise<Result<PublicUser>> {
  const validation = validateLoginInput(input);
  if (!validation.ok) return validation;

  try {
    const payload = await apiRequest<RenderResponse<AuthResponse>>(API.login, {
      method: "POST",
      body: JSON.stringify({
        email: validation.data.email,
        password: validation.data.password,
      }),
    });
    return { ok: true, data: readAuthAccount(payload, "Impossible de se connecter.") };
  } catch (error) {
    return { ok: false, error: renderError(error, "Impossible de se connecter.") };
  }
}

export async function fetchCurrentAccount(): Promise<PublicUser | null> {
  try {
    const payload = await apiRequest<RenderResponse<Account>>(API.me);
    if (payload.code !== 200 || !payload.data?.email) return null;
    return accountToUser(payload.data);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      return null;
    }
    throw error;
  }
}

export async function logoutAccount(): Promise<void> {
  try {
    await apiRequest<RenderResponse<unknown>>(API.logout, { method: "POST" });
  } catch {
    // La session locale est tout de même effacée.
  } finally {
    clearToken();
  }
}

export function validateProfileInput(input: ProfileInput): Result<ProfileInput> {
  const username = input.username.trim();
  const email = normalizeEmail(input.email);
  const phone = input.phone.trim();
  const password = input.password;
  const passwordConfirmation = input.passwordConfirmation;

  if (username.length < 2) {
    return { ok: false, error: "Saisissez un nom d’utilisateur." };
  }
  if (!isValidEmail(email)) {
    return { ok: false, error: "Saisissez une adresse e-mail valide." };
  }
  if (!isValidPhone(phone)) {
    return { ok: false, error: "Saisissez un numéro de téléphone valide." };
  }
  if (password || passwordConfirmation) {
    if (password !== passwordConfirmation) {
      return { ok: false, error: "Les deux mots de passe sont différents." };
    }
    if (password.length < 8) {
      return { ok: false, error: "Le mot de passe doit contenir au moins 8 caractères." };
    }
  }

  return { ok: true, data: { ...input, username, email, phone, password } };
}

export async function updateAccount(input: ProfileInput): Promise<Result<PublicUser>> {
  const validation = validateProfileInput(input);
  if (!validation.ok) return validation;

  try {
    const payload = await apiRequest<RenderResponse<Account>>(API.me, {
      method: "PUT",
      body: JSON.stringify({
        username: validation.data.username,
        email: validation.data.email,
        phone: validation.data.phone,
        ...(validation.data.password ? { password: validation.data.password } : {}),
      }),
    });
    if (payload.code !== 200) {
      throw new ApiError(payload.message?.trim() || payload.error?.trim() || "Impossible de mettre à jour le compte.", payload.code);
    }
    if (!payload.data?.email) {
      throw new ApiError("Impossible de mettre à jour le compte.", payload.code);
    }
    const refreshed = await fetchCurrentAccount();
    return { ok: true, data: refreshed ?? accountToUser(payload.data) };
  } catch (error) {
    return { ok: false, error: renderError(error, "Impossible de mettre à jour le compte.") };
  }
}
