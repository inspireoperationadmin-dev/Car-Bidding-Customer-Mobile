import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENV } from '../config/env';
import { TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY, updateTokens, logoutUser } from '../store/slices/authSlice';

// ── API Server Configuration ──
export const AZURE_API_URL = 'https://car-bidding-api-w6y8m.azurewebsites.net';
export const LOCAL_EMULATOR_URL = 'http://10.0.2.2:3000';

export const BASE_URL = ENV.apiBaseUrl || AZURE_API_URL;

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

/* 🔐 Attach token automatically */
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Refresh token state (prevents concurrent refresh calls) ──
let isRefreshing = false;
let failedQueue: {
  resolve: (token: string) => void;
  reject: (err: any) => void;
}[] = [];

const processQueue = (error: any, token: string | null) => {
  failedQueue.forEach((p) => {
    if (error) {
      p.reject(error);
    } else {
      p.resolve(token!);
    }
  });
  failedQueue = [];
};

// URLs that should NOT trigger a token refresh on 401
const NO_REFRESH_URLS = ['/api/auth/login', '/api/auth/register', '/api/auth/refresh'];

/* 🚨 Handle 401 Silent Refresh and 403 Forbidden */
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // ── Handle 403 Forbidden: Mismatched role or invalid session ──
    if (error.response?.status === 403) {
      console.warn('Forbidden (403) – clearing session');
      await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY]);
      const { store } = require('../store');
      store.dispatch(logoutUser());
      return Promise.reject(error);
    }

    // Only attempt refresh for 401 errors
    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // Don't refresh for auth endpoints (login, register, refresh itself)
    const url = originalRequest?.url || '';
    if (NO_REFRESH_URLS.some((u) => url.includes(u))) {
      return Promise.reject(error);
    }

    // Don't retry if we already retried this request
    if (originalRequest?._retry) {
      await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY]);
      const { store } = require('../store');
      store.dispatch(logoutUser());
      return Promise.reject(error);
    }

    // If a refresh is already in progress, queue this request
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    // Start the refresh flow
    if (originalRequest) {
      originalRequest._retry = true;
    }
    isRefreshing = true;

    try {
      const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);

      if (!refreshToken) {
        processQueue(error, null);
        await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY]);
        const { store } = require('../store');
        store.dispatch(logoutUser());
        return Promise.reject(error);
      }

      // Call refresh endpoint directly using raw axios to avoid interceptor recursion
      const res = await axios.post(`${BASE_URL}/api/auth/refresh`, { refreshToken });

      const newToken: string = res.data?.data?.token;
      const newRefreshToken: string = res.data?.data?.refreshToken;

      if (!newToken) {
        processQueue(error, null);
        await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY]);
        const { store } = require('../store');
        store.dispatch(logoutUser());
        return Promise.reject(error);
      }

      // Persist updated tokens
      await AsyncStorage.setItem(TOKEN_KEY, newToken);
      if (newRefreshToken) {
        await AsyncStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
      }

      // Update Redux state
      const { store } = require('../store');
      store.dispatch(updateTokens({ token: newToken }));

      processQueue(null, newToken);

      if (originalRequest) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      }
      return Promise.reject(error);
    } catch (refreshErr) {
      processQueue(refreshErr, null);
      await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY]);
      const { store } = require('../store');
      store.dispatch(logoutUser());
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);

export default apiClient;
