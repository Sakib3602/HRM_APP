import { clearTokens, getAccessToken, getRefreshToken, saveTokens } from "@/storage/secureStore";
import axios from "axios";


const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

console.log("BASE_URL is:", process.env.EXPO_PUBLIC_BASE_URL);

const axiosClient = axios.create({ baseURL: BASE_URL });

let unauthorizedCallback: (() => void) | null = null;
let refreshPromise: Promise<string> | null = null;

export const setUnauthorizedCallback = (callback: () => void) => {
  unauthorizedCallback = callback;
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
    
    // Do not attempt token refresh for authentication requests (login, logout, refresh)
    const isAuthRequest = 
      originalRequest.url?.includes("/auth/login") || 
      originalRequest.url?.includes("/auth/logout") || 
      originalRequest.url?.includes("/auth/refresh");

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthRequest
    ) {
      originalRequest._retry = true;
      try {
        const newToken = await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axiosClient(originalRequest);
      } catch (refreshError) {
        await clearTokens();
        if (unauthorizedCallback) unauthorizedCallback();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;