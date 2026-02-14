import { fetchUser, logoutUser } from "@/services/api/api";
import { ProfileData } from "@/types/shared";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

interface AuthState {
  user: ProfileData | null;
  loading: boolean;
  loadUser: () => Promise<void>;
  logout: (options?: { skipServer?: boolean }) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,

  loadUser: async () => {
    set({ loading: true });

    try {
      const json = await AsyncStorage.getItem("user");
      console.log(
        "Loaded user from AsyncStorage:",
        json ? JSON.parse(json) : null,
      );
      if (json) {
        return set({ user: JSON.parse(json), loading: false });
      }

      const apiUser = await fetchUser();
      console.log("Fetched user from API:", apiUser);
      if (apiUser) {
        await AsyncStorage.setItem("user", JSON.stringify(apiUser.data));
        set({ user: apiUser.data, loading: false });
      }
    } catch {
      set({ user: null, loading: false });
    } finally {
      set({ loading: false });
    }
  },

  logout: async (options?: { skipServer?: boolean }) => {
    const refreshToken = await AsyncStorage.getItem("refresh_token");

    // Clear local storage and state immediately
    await AsyncStorage.multiRemove(["access_token", "refresh_token", "user"]);

    set({ user: null });

    // If forced logout → stop here we don't want to call the server and potentially cause issues with the logout function
    if (options?.skipServer) return;

    // Normal logout → we notify backend to invalidate the refresh token as well, but we don't want to block the logout if the server call fails for some reason
    if (refreshToken) {
      try {
        await logoutUser(refreshToken);
      } catch (err) {
        console.warn("Server logout failed:", err);
      }
    }
  },
}));
