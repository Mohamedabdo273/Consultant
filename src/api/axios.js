import axios from 'axios';

// In development Vite proxies /api → https://consultation.runasp.net (no CORS).
// In production the full URL is used directly.
const API_BASE = import.meta.env.DEV
  ? '/api'
  : 'https://consultation.runasp.net/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 120000, // 2 min — AI analysis can take up to 90s
});

// ── Request interceptor — attach token + language ──────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;

  const lang = localStorage.getItem('lang') || 'ar';
  config.headers['Accept-Language'] = lang;

  return config;
});

// ── Response interceptor — handle 401, refresh token ──────────────────────
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const { data } = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken });
        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);
        original.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(original);
      } catch {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
