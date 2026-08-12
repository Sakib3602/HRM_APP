import { clearTokens, getAccessToken, getRefreshToken, saveTokens } from "@/storage/secureStore";
import axios from "axios";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

// eslint-disable-next-line import/no-named-as-default-member
const axiosClient = axios.create({ baseURL: BASE_URL });

let refreshPromise: Promise<string> | null = null;
let onUnauthorized: (() => void) | null = null;

export const setUnauthorizedCallback = (callback: () => void) => {
  onUnauthorized = callback;
};

const refreshAccessToken = async (): Promise<string> => {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) throw new Error("No refresh token");
      const res = await axiosClient.post(`${BASE_URL}/auth/refresh`, { refreshToken });
      const { accessToken, refreshToken: newRefreshToken } = res.data;
      await saveTokens(accessToken, newRefreshToken);
      return accessToken;
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
};

axiosClient.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/refresh")
    ) {
      originalRequest._retry = true;
      try {
        const newToken = await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axiosClient(originalRequest);
      } catch (refreshError) {
        await clearTokens();
        onUnauthorized?.();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;