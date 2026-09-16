import { API, apiRequest, setToken, toErrorMessage } from "@multitrack/api-client";
import type { AuthResponse } from "@multitrack/types";

export { toErrorMessage };

export async function login(email: string, password: string) {
  const response = await apiRequest<AuthResponse>(API.login, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  const token = response.token ?? response.accessToken;
  if (!token) throw new Error("Le serveur n’a pas renvoyé de jeton de connexion.");
  setToken(token);
}
