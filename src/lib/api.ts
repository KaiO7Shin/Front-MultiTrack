import axios from "axios";
import { clearBoMemoryCaches } from "@/lib/boMemoryCache";
import {
  clearSessionStorage,
  isJwtExpired,
  readStoredToken,
} from "@/lib/session";

const baseURL =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.DEV
    ? "/api"
    : "https://b-mtrack-service.onrender.com/api");

const apiClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    if (config.headers && typeof config.headers.delete === "function") {
      config.headers.delete("Content-Type");
    } else if (config.headers) {
      delete config.headers["Content-Type"];
    }
  }
  const token = readStoredToken();
  if (token && !isJwtExpired(token)) {
    config.headers.Authorization = `Bearer ${token}`;
  } else if (token && isJwtExpired(token)) {
    clearBoMemoryCaches();
    clearSessionStorage();
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = String(error?.config?.url ?? "");
    const isLogin = url.includes("/login/user");

    if (status === 401 && !isLogin) {
      clearBoMemoryCaches();
      clearSessionStorage();
      if (window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
