import axios from 'axios';

const axiosClient = axios.create(
    {
        baseURL:import.meta.env.VITE_API_BASE_URL,
        headers: {'Content-Type':'application/json'},
    }
);

//automatically attach the token to each request
axiosClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer${token}`;
    return config;
})

//if backend returns 401 -> we clean session and redirect to login
axiosClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default axiosClient;