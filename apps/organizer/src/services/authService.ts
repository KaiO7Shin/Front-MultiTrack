import { API, apiRequest, setToken, toErrorMessage, unwrapData } from "@multitrack/api-client";
import type { AuthResponse, RenderResponse } from "@multitrack/types";

export { toErrorMessage };

export async function login(email: string, password: string) {
  const payload = await apiRequest<RenderResponse<AuthResponse>>(API.login, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  const response = unwrapData(payload);
  const token = response.token ?? response.accessToken;
  if (!token) throw new Error("Le serveur n’a pas renvoyé de jeton de connexion.");
  setToken(token);
}
