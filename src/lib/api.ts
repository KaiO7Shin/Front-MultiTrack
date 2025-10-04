import axios from "axios";

const apiClient = axios.create({
  baseURL: "http://192.168.88.103:8080", // configure dans .env
  headers: { 
    "Content-Type": "application/json",
   },
});

// Intercepteur: ajoute automatiquement le token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default apiClient;
