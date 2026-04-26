import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AUTH_TOKEN_COOKIE } from "../lib/auth.constants";
import type { AuthTokens } from "../types/sign-in.types";

type AuthState = {
  tokens: AuthTokens | null;
  setTokens: (t: AuthTokens) => void;
  clearTokens: () => void;
};

function setAuthCookie(tokens: AuthTokens) {
  if (typeof document === "undefined") return;

  const maxAge = Math.max(0, tokens.expires_in);
  document.cookie = `${AUTH_TOKEN_COOKIE}=${encodeURIComponent(
    tokens.access_token,
  )}; path=/; max-age=${maxAge}; samesite=lax`;
}

function clearAuthCookie() {
  if (typeof document === "undefined") return;

  document.cookie = `${AUTH_TOKEN_COOKIE}=; path=/; max-age=0; samesite=lax`;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      tokens: null,
      setTokens: (tokens) => {
        setAuthCookie(tokens);
        set({ tokens });
      },
      clearTokens: () => {
        clearAuthCookie();
        set({ tokens: null });
      },
    }),
    {
      name: "cradlen-auth",
      onRehydrateStorage: () => (state) => {
        if (state?.tokens) setAuthCookie(state.tokens);
      },
    },
  )
);
