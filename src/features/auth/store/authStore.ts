import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthTokens } from "../types/sign-in.types";

type AuthState = {
  tokens: AuthTokens | null;
  setTokens: (t: AuthTokens) => void;
  clearTokens: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      tokens: null,
      setTokens: (tokens) => set({ tokens }),
      clearTokens: () => set({ tokens: null }),
    }),
    { name: "cradlen-auth" }
  )
);
