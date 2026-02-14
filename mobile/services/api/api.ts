import axiosClient from "@/utils/axios";
import { AxiosError } from "axios";

/**
 * Checks whether the current session is authenticated.
 *
 * @returns Promise resolving to authentication status data
 * @throws AxiosError when request fails
 */
export const checkAuth = async (): Promise<any> => {
  try {
    const response = await axiosClient.get("/auth/check/");
    return response.data;
  } catch (error) {
    const err = error as AxiosError;
    console.error("checkAuth failed:", err.response?.data || err.message);
    throw err;
  }
};

/**
 * Fetches the authenticated user's profile.
 *
 * @returns Promise resolving to user profile data
 * @throws AxiosError when request fails
 */
export const fetchUser = async (): Promise<any> => {
  try {
    const response = await axiosClient.get("/users/profile/");
    return response.data;
  } catch (error) {
    const err = error as AxiosError;
    console.error("fetchUser failed:", err.response?.data || err.message);
    throw err;
  }
};

/**
 * Updates the authenticated user's profile.
 *
 * @param data - Multipart form data containing profile fields
 * @returns Promise resolving to updated profile response
 * @throws AxiosError when request fails
 */
export const updateUser = async (data: FormData): Promise<any> => {
  try {
    const response = await axiosClient.put("/users/profile/update/", data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) {
    const err = error as AxiosError;
    console.error("updateUser failed:", err.response?.data || err.message);
    throw err;
  }
};

/**
 * Changes the user's password.
 *
 * @param current_password - Existing password
 * @param new_password - Desired new password
 * @param confirm_password - Confirmation password
 * @returns Promise resolving to password change response
 * @throws AxiosError when request fails
 */
export const changePassword = async (
  current_password: string,
  new_password: string,
  confirm_password: string,
): Promise<any> => {
  try {
    const response = await axiosClient.post("/users/profile/change-password/", {
      current_password,
      new_password,
      confirm_password,
    });
    return response.data;
  } catch (error) {
    const err = error as AxiosError;
    console.error("changePassword failed:", err.response?.data || err.message);
    throw err;
  }
};

/**
 * Sets up password during first-time staff login.
 *
 * @param new_password - Desired password
 * @param confirm_password - Confirmation password
 * @returns Promise resolving to setup confirmation response
 * @throws AxiosError when request fails
 */
export const setUpPassword = async (
  new_password: string,
  confirm_password: string,
): Promise<any> => {
  try {
    const response = await axiosClient.post(
      "/users/profile/staff/setup-password/",
      {
        new_password,
        confirm_password,
      },
    );
    return response.data;
  } catch (error) {
    const err = error as AxiosError;
    console.error("setUpPassword failed:", err.response?.data || err.message);
    throw err;
  }
};

/**
 * Logs the user out using a refresh token.
 *
 * @param refresh_token - Stored refresh token
 * @returns Promise resolving to logout confirmation or null
 * @throws AxiosError when request fails
 */
export const logoutUser = async (refresh_token: string): Promise<any> => {
  try {
    if (!refresh_token) return null;

    const response = await axiosClient.post("/users/auth/logout/", {
      refresh_token,
    });

    return response.data;
  } catch (error) {
    const err = error as AxiosError;
    console.error("logoutUser failed:", err.response?.data || err.message);
    throw err;
  }
};
