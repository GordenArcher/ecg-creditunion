import { useAuthStore } from "@/stores/useAuthStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const axiosClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_BACKEND_API_URL,
  timeout: 10000,
  timeoutErrorMessage: "Please check your internet connection and try again.",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

axiosClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest || error.response?.status !== 401) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) return Promise.reject(error);
    originalRequest._retry = true;

    try {
      const refreshToken = await AsyncStorage.getItem("refresh_token");
      if (!refreshToken) return;

      const res = await axios.post(
        `${process.env.EXPO_PUBLIC_BACKEND_API_URL}/users/auth/refresh/`,
        { refresh: refreshToken },
      );

      const { access_token } = res.data.data;
      if (!access_token) throw new Error("No access token in refresh response");

      await AsyncStorage.setItem("access_token", access_token);

      originalRequest.headers.Authorization = `Bearer ${access_token}`;
      return axiosClient(originalRequest);
    } catch (err) {
      const { logout } = useAuthStore.getState();

      await logout({ skipServer: true }); // Ensure we pass a false value to avoid issues in the logout function
      return Promise.reject(err);
    }
  },
);

export default axiosClient;
