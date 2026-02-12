import { create } from "zustand";
import { checkAuth, fetchStations, fetchDivisions } from "../api/api";
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

interface AuthResponse {
  data: {
    is_authenticated: boolean;
  };
}

interface Station {
  id: number;
  code: string;
  name: string;
  location: string;
  phone: string;
  email: string;
  is_active: boolean;
}

interface Division {
  id: number;
  code: string;
  name: string;
  description: string;
  directorate: string;
  is_active: boolean;
}

interface PaginatedResponse<T> {
  success: boolean;
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
  results: T[];
}

interface AuthStore {
  user: unknown | null;
  isAuthenticated: boolean;

  loading: boolean;
  authChecking: boolean;

  error: string | null;

  checkAuth: () => Promise<void>;

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

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,

  loading: false,
  authChecking: true,

  error: null,

  stations: [],
  allStations: [],
  stationsLoading: false,
  stationsPagination: null,

  divisions: [],
  allDivisions: [],
  divisionsLoading: false,
  divisionsPagination: null,

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
        user: null,
        isAuthenticated: false,
        authChecking: false,
        error: err?.message || "Auth check failed",
      });
    }
  },

  fetchStations: async (page = 1, pageSize = 10, search = "") => {
    set({ stationsLoading: true });
    try {
      const params: Record<string, any> = { page, page_size: pageSize };
      if (search) params.search = search;

      const response = await await fetchStations();

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
