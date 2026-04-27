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

let isLoggingOut = false;

api.interceptors.response.use(
  (response) => {
    window.dispatchEvent(new CustomEvent('unitickets-api-end'));
    return response;
  },
  (error) => {
    window.dispatchEvent(new CustomEvent('unitickets-api-end'));

    if (error.response && error.response.status === 401) {
      // Prevent redirect loops and duplicate clears
      if (!isLoggingOut && window.location.pathname !== '/login') {
        isLoggingOut = true;
        
        // Clear auth data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Trigger cross-tab sync so other tabs also logout
        localStorage.setItem('logout', Date.now().toString());
        
        // Redirect to login (full reload flushes all React state memory)
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
