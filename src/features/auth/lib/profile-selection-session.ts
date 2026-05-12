import type { UserProfile } from "@/common/types/user.types";

const PROFILE_SELECTION_KEY = "cradlen-profile-selection";

export type PendingProfileSelection = {
  profiles: UserProfile[];
};

export function getPendingProfileSelection() {
  if (typeof window === "undefined") return null;

  const raw = window.sessionStorage.getItem(PROFILE_SELECTION_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as PendingProfileSelection;
    return Array.isArray(parsed.profiles) ? parsed : null;
  } catch {
    return null;
  }
}

export function setPendingProfileSelection(selection: PendingProfileSelection) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(PROFILE_SELECTION_KEY, JSON.stringify(selection));
}

export function clearPendingProfileSelection() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(PROFILE_SELECTION_KEY);
}
