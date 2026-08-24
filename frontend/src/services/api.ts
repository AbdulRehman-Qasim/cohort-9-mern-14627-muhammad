import axios, { InternalAxiosRequestConfig } from 'axios';
let activeSessionId: string | null = null;
export const setSessionId = (id: string | null) => {
  activeSessionId = id;
};
export const getSessionId = () => activeSessionId;
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  sessionId?: string | null;
}
api.interceptors.request.use((config: CustomAxiosRequestConfig) => {
  config.sessionId = activeSessionId;
  return config;
});
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const requestSessionId = (error.config as CustomAxiosRequestConfig)?.sessionId;
      if (requestSessionId === activeSessionId) {
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }
    }
    return Promise.reject(error);
  }
);
export default api;