import { useState } from "react";
import { getToken, clearToken } from "@multitrack/api-client";

export function useAuth() {
  const [authenticated, setAuthenticated] = useState(Boolean(getToken()));

  function logout() {
    clearToken();
    setAuthenticated(false);
  }

  return {
    authenticated,
    markAuthenticated: () => setAuthenticated(true),
    logout,
  };
}
