import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserProfile } from "@/types/user.types";
import { AUTH_SELECTION_TOKEN_MAX_AGE } from "../lib/auth.constants";

const TTL_MS = AUTH_SELECTION_TOKEN_MAX_AGE * 1000;

type AvailableProfilesState = {
  profiles: UserProfile[];
  expiresAt: number | null;
  setAvailableProfiles: (profiles: UserProfile[]) => void;
  clearAvailableProfiles: () => void;
};

export const useAvailableProfilesStore = create<AvailableProfilesState>()(
  persist(
    (set) => ({
      profiles: [],
      expiresAt: null,
      setAvailableProfiles: (profiles) =>
        set({ profiles, expiresAt: Date.now() + TTL_MS }),
      clearAvailableProfiles: () => set({ profiles: [], expiresAt: null }),
    }),
    { name: "cradlen-available-profiles" },
  ),
);

// Stable sentinel: returning a fresh `[]` from a Zustand selector breaks
// useSyncExternalStore's reference equality and causes React #185 loops.
const EMPTY_PROFILES: UserProfile[] = Object.freeze([]) as unknown as UserProfile[];

// Mirrors the selection_token's 30-min server-side TTL: returns the cached list
// only while still within that window, otherwise the shared empty sentinel.
// Use this in components/hooks that drive the org switcher.
export function getValidAvailableProfiles(
  state: Pick<AvailableProfilesState, "profiles" | "expiresAt">,
): UserProfile[] {
  if (!state.expiresAt) return EMPTY_PROFILES;
  if (Date.now() >= state.expiresAt) return EMPTY_PROFILES;
  return state.profiles;
}
