import axios from "axios";
import { navigateTo } from "./navigation";

const axiosClient = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

axiosClient.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest || error.response?.status !== 401) {
      return Promise.reject(error);
    }

    if (!originalRequest._retryCount) {
      originalRequest._retryCount = 0;
    }

    if (originalRequest._retryCount >= 3) {
      // emitAuthExpired();
      //
      navigateTo("/auth/login");
      return Promise.reject(error);
    }

    originalRequest._retryCount += 1;

    await new Promise((resolve) => setTimeout(resolve, 300));

    return axiosClient.request(originalRequest);
  },
);

export default axiosClient;
