import { create } from "zustand";

type AuthState = {
  isAuthenticated: boolean;
  setAuthenticated: () => void;
  clearSession: () => void;
};

export const useAuthStore = create<AuthState>()((set) => ({
  isAuthenticated: false,
  setAuthenticated: () => set({ isAuthenticated: true }),
  clearSession: () => set({ isAuthenticated: false }),
}));
