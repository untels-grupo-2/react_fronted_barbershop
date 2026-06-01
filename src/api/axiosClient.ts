import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const axiosClient = axios.create({ baseURL: API_BASE_URL, headers: { 'Content-Type': 'application/json' } });

//automatically attach the token to each request
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  const isAuthEndpoint = config.url?.includes('/api/autenticacion/');
  if (token && !isAuthEndpoint) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

//if backend returns 401 -> we clean session and redirect to login
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url ?? '';
    const isAuthEndpoint = requestUrl.includes('/api/autenticacion/');

    if (status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('token');
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
