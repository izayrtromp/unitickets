import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : 'http://localhost:5001/api',
});

api.interceptors.request.use((config) => {
  window.dispatchEvent(new CustomEvent('unitickets-api-start'));
  
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    window.dispatchEvent(new CustomEvent('unitickets-api-end'));
    return response;
  },
  (error) => {
    window.dispatchEvent(new CustomEvent('unitickets-api-end'));
    return Promise.reject(error);
  }
);

export default api;
