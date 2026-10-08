import axios from 'axios';

export const getApiBaseUrl = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined') {
    const { hostname } = window.location;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3000';
    }
    return 'https://api.vivoxmarketing.com.br';
  }
  return 'http://localhost:3000';
};

export const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('@Vivox:token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 no próprio login é senha errada: deixa a tela tratar o erro
    const isLoginRequest = error.config?.url?.includes('/auth/login');
    if (error.response && error.response.status === 401 && !isLoginRequest) {
      const isPortal = window.location.pathname.startsWith('/portal');
      localStorage.removeItem('@Vivox:token');
      localStorage.removeItem('@Vivox:user');
      const destino = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = isPortal ? `/portal/entrar?destino=${destino}` : '/login';
    }
    return Promise.reject(error);
  }
);
