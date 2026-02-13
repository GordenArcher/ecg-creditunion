import { create } from "zustand";
import { checkAuth, fetchStations, fetchDivisions, GetUser } from "../api/api";
import axiosClient from "../utils/axios";

interface Station {
  id: number;
  code: string;
  name: string;
  location?: string;
  phone?: string;
  email?: string;
  is_active: boolean;
}

interface Division {
  id: number;
  code: string;
  name: string;
  description?: string;
  directorate?: string;
  is_active: boolean;
}

interface User {
  id: number;
  staff_id: string;
  full_name: string;
  email: string;
  phone_number: string;
  title: string;
  gender: string;
  date_of_birth: string;
  marital_status: string;
  number_of_dependents: number;
  station_id: number;
  station_name?: string;
  station_code?: string;
  division_id: number;
  division_name?: string;
  division_code?: string;
  directorate: string;
  date_registered: string;
  role: string;
  is_active: boolean;
  profile_picture?: string;
  otp_email_enabled: boolean;
  otp_sms_enabled: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthResponse {
  data: {
    is_authenticated: boolean;
    user?: User;
  };
}

interface PaginatedResponse<T> {
  success: boolean;
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
  results: T[];
}

interface PasswordChangeData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

interface AuthStore {
  user: User | null;
  loadinguser: boolean;
  updatingProfile: boolean;

  isAuthenticated: boolean;
  setIsAuthenticated: (value: boolean) => void;

  loading: boolean;
  logingOut: boolean;
  authChecking: boolean;
  error: string | null;
  profileUpdateError: string | null;
  success: string | null;

  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;

  fetchUserProfile: () => Promise<void>;
  updateUserProfile: (userData: Partial<User>) => Promise<void>;
  updateOTPSettings: (
    emailEnabled: boolean,
    smsEnabled: boolean,
  ) => Promise<void>;
  changePassword: (passwordData: PasswordChangeData) => Promise<void>;
  uploadProfilePicture: (file: File) => Promise<void>;

  clearAuth: () => void;
  clearMessages: () => void;

  stations: Station[];
  allStations: Station[];
  stationsLoading: boolean;
  stationsPagination: {
    count: number;
    page: number;
    page_size: number;
    total_pages: number;
  } | null;

  divisions: Division[];
  allDivisions: Division[];
  divisionsLoading: boolean;
  divisionsPagination: {
    count: number;
    page: number;
    page_size: number;
    total_pages: number;
  } | null;

  fetchStations: (
    page?: number,
    pageSize?: number,
    search?: string,
  ) => Promise<void>;
  fetchAllStations: () => Promise<void>;
  fetchDivisions: (
    page?: number,
    pageSize?: number,
    search?: string,
  ) => Promise<void>;
  fetchAllDivisions: () => Promise<void>;
  clearStations: () => void;
  clearDivisions: () => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  loadinguser: false,
  isAuthenticated: false,
  logingOut: false,
  updatingProfile: false,

  loading: false,
  authChecking: true,
  error: null,
  profileUpdateError: null,
  success: null,

  stations: [],
  allStations: [],
  stationsLoading: false,
  stationsPagination: null,

  divisions: [],
  allDivisions: [],
  divisionsLoading: false,
  divisionsPagination: null,

  setIsAuthenticated: (value: boolean) => set({ isAuthenticated: value }),

  checkAuth: async () => {
    set({ authChecking: true, error: null });
    try {
      const res: AuthResponse = await checkAuth();
      set({
        isAuthenticated: res?.data?.is_authenticated ?? false,
        authChecking: false,
      });
    } catch (err: any) {
      set({
        isAuthenticated: false,
        authChecking: false,
        error: err?.message || "Auth check failed",
      });
    }
  },

  logout: async () => {
    set({ logingOut: true, error: null });
    try {
      const response = await axiosClient.post("/users/auth/logout/");

      if (response) {
        set({
          user: null,
          isAuthenticated: response.data?.data?.is_authenticated ?? false,
          logingOut: false,
          success: response.data?.message || "Logout successful",
        });
      }
    } catch (err: any) {
      return err;
    } finally {
      set({ logingOut: false });
    }
  },

  fetchUserProfile: async () => {
    set({ loadinguser: true, error: null });
    try {
      const response = await GetUser();

      if (response) {
        set({
          user: response.data,
          loadinguser: false,
        });
      }
    } catch (err: any) {
      set({
        loading: false,
        error: err.response?.data?.message || "Failed to fetch profile",
      });
      throw err;
    }
  },

  updateUserProfile: async (userData: Partial<User>) => {
    set({ updatingProfile: true, profileUpdateError: null, success: null });
    try {
      const { ...updateData } = userData as any;

      const response = await axiosClient.put(
        "/users/profile/update/",
        updateData,
      );

      if (response) {
        set({
          user: response.data.data,
          updatingProfile: false,
          success: "Profile updated successfully",
        });
      }
    } catch (err: any) {
      set({
        updatingProfile: false,
        profileUpdateError:
          err.response?.data?.message || "Failed to update profile",
      });
      throw err;
    }
  },

  updateOTPSettings: async (emailEnabled: boolean, smsEnabled: boolean) => {
    set({ loading: true, error: null, success: null });
    try {
      const response = await axiosClient.put("/users/profile/otp-settings/", {
        otp_email_enabled: emailEnabled,
        otp_sms_enabled: smsEnabled,
      });

      if (response) {
        set((state) => ({
          user: state.user
            ? {
                ...state.user,
                otp_email_enabled: emailEnabled,
                otp_sms_enabled: smsEnabled,
              }
            : null,
          loading: false,
          success: "OTP settings updated successfully",
        }));
      }
    } catch (err: any) {
      set({
        loading: false,
        error: err.response?.data?.message || "Failed to update OTP settings",
      });
      throw err;
    }
  },

  changePassword: async (passwordData: PasswordChangeData) => {
    set({ loading: true, error: null, success: null });
    try {
      const response = await axiosClient.post(
        "/users/profile/change-password/",
        passwordData,
      );

      if (response) {
        set({
          loading: false,
          success: "Password changed successfully",
        });
      }
    } catch (err: any) {
      set({
        loading: false,
        error: err.response?.data?.message || "Failed to change password",
      });
      throw err;
    }
  },

  uploadProfilePicture: async (file: File) => {
    set({ loading: true, error: null, success: null });
    try {
      const formData = new FormData();
      formData.append("profile_picture", file);

      const response = await axiosClient.post(
        "/users/profile/upload-picture/",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      if (response) {
        set((state) => ({
          user: state.user
            ? {
                ...state.user,
                profile_picture: response.data.profile_picture_url,
              }
            : null,
          loading: false,
          success: "Profile picture updated successfully",
        }));
      }
    } catch (err: any) {
      set({
        loading: false,
        error:
          err.response?.data?.message || "Failed to upload profile picture",
      });
      throw err;
    }
  },

  clearAuth: () => {
    set({
      user: null,
      isAuthenticated: false,
      error: null,
      success: null,
    });
  },

  clearMessages: () => {
    set({ error: null, success: null });
  },

  fetchStations: async (page = 1, pageSize = 10, search = "") => {
    set({ stationsLoading: true });
    try {
      const params: Record<string, any> = { page, page_size: pageSize };
      if (search) params.search = search;

      const response = await fetchStations();

      if (response) {
        set({
          stations: response.data.results,
          stationsPagination: {
            count: response.data.count,
            page: response.data.page,
            page_size: response.data.page_size,
            total_pages: response.data.total_pages,
          },
        });
      }
    } catch (error) {
      console.error("Error fetching stations:", error);
    } finally {
      set({ stationsLoading: false });
    }
  },

  fetchAllStations: async () => {
    set({ stationsLoading: true });
    try {
      const response = await fetchStations();
      if (response) {
        set({ allStations: response.data });
      }
    } catch (error) {
      console.error("Error fetching all stations:", error);
    } finally {
      set({ stationsLoading: false });
    }
  },

  fetchDivisions: async (page = 1, pageSize = 10, search = "") => {
    set({ divisionsLoading: true });
    try {
      const params: Record<string, any> = { page, page_size: pageSize };
      if (search) params.search = search;

      const response = await axiosClient.get("/divisions/", { params });

      if (response.data.status === "success") {
        set({
          divisions: response.data.data.results,
          divisionsPagination: {
            count: response.data.data.count,
            page: response.data.data.page,
            page_size: response.data.data.page_size,
            total_pages: response.data.data.total_pages,
          },
        });
      }
    } catch (error) {
      console.error("Error fetching divisions:", error);
    } finally {
      set({ divisionsLoading: false });
    }
  },

  fetchAllDivisions: async () => {
    set({ divisionsLoading: true });
    try {
      const response = await fetchDivisions();
      if (response) {
        set({ allDivisions: response.data });
      }
    } catch (error) {
      console.error("Error fetching all divisions:", error);
    } finally {
      set({ divisionsLoading: false });
    }
  },

  clearStations: () => {
    set({ stations: [], allStations: [], stationsPagination: null });
  },

  clearDivisions: () => {
    set({ divisions: [], allDivisions: [], divisionsPagination: null });
  },
}));
