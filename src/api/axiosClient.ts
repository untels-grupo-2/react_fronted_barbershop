import axios, { AxiosError } from 'axios';
import { clearAuthSession, updateAuthTokens } from '../lib/authSession.ts';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const axiosClient = axios.create({ baseURL: API_BASE_URL, headers: { 'Content-Type': 'application/json' } });

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (error: AxiosError) => void }> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token || '');
    }
  });
  failedQueue = [];
};

//automatically attach the token to each request
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  const isAuthEndpoint = config.url?.includes('/api/autenticacion/');
  if (token && !isAuthEndpoint) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

//if backend returns 401 -> attempt token refresh, otherwise clean session and redirect to login
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url ?? '';
    const isAuthEndpoint = requestUrl.includes('/api/autenticacion/');

    if (status === 401 && !isAuthEndpoint) {
      const refreshToken = localStorage.getItem('refreshToken');

      if (!refreshToken) {
        clearAuthSession();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            error.config.headers.Authorization = `Bearer ${token}`;
            return axiosClient(error.config);
          })
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;

      try {
        const response = await axios.post(`${API_BASE_URL}/api/autenticacion/refresh-token`, { refreshToken });
        const newToken = response.data?.data?.token;
        const newRefreshToken = response.data?.data?.refreshToken;

        if (newToken && newRefreshToken) {
          updateAuthTokens(newToken, newRefreshToken);
          error.config.headers.Authorization = `Bearer ${newToken}`;
          processQueue(null, newToken);
          return axiosClient(error.config);
        } else {
          throw new Error('Invalid refresh response');
        }
      } catch (refreshError) {
        const axiosError = refreshError instanceof AxiosError ? refreshError : null;
        processQueue(axiosError, null);
        clearAuthSession();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    } else if (status === 401 && isAuthEndpoint) {
      clearAuthSession();
      window.location.href = '/login';
    }

    return Promise.reject(error);
  },
);

export const postWithFile = (url: string, formData: FormData) => {
  return uploadWithFile('post', url, formData);
};

export const putWithFile = (url: string, formData: FormData) => {
  return uploadWithFile('put', url, formData);
};

const uploadWithFile = (method: 'post' | 'put', url: string, formData: FormData) => {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  // No enviamos Content-Type para que el navegador agregue multipart/form-data con boundary.
  return axios.request({ method, baseURL: API_BASE_URL, url, data: formData, headers });
};

export default axiosClient;
