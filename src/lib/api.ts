import axios from "axios";

const baseURL =
  import.meta.env.VITE_API_URL ?? "https://b-mtrack-service.onrender.com/api";

const apiClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = String(error?.config?.url ?? "");
    const isLogin = url.includes("/login/user");
    const token = localStorage.getItem("token");
    const isStaticSession = Boolean(token?.startsWith("static-"));

    if (status === 401 && !isLogin && !isStaticSession) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;