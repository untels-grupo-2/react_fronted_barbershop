import axios from "axios";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

//automatically attach the token to each request
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  const isAuthEndpoint = config.url?.includes("/api/autenticacion/");
  if (token && !isAuthEndpoint)
    config.headers.Authorization = `Bearer ${token}`;
  return config;
});

//if backend returns 401 -> we clean session and redirect to login
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url ?? "";
    const isAuthEndpoint = requestUrl.includes("/api/autenticacion/");

    if (status === 401 && !isAuthEndpoint) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default axiosClient;
