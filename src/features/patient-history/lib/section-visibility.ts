"use client";

import { useCallback, useState } from "react";

// Visibility for patient-history GROUPS (e.g. "Gynecological History").
// The public API keeps the legacy "section visibility" name to minimise
// churn at call sites, but the stored set holds group names. localStorage
// key is per-profile; replace the backend later with a user-preferences
// API without touching consumers.
const KEY = (profileId: string) => `patientHistory.hiddenGroups.${profileId}`;

function readFromStorage(profileId: string | null | undefined): Set<string> {
  if (!profileId || typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(KEY(profileId));
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.filter((v): v is string => typeof v === "string"));
  } catch {
    return new Set();
  }
}

function writeToStorage(profileId: string, hidden: Set<string>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY(profileId), JSON.stringify([...hidden]));
  } catch {
    // Ignore quota / private-mode errors; visibility is best-effort UX.
  }
}

export interface SectionVisibility {
  hidden: ReadonlySet<string>;
  toggle: (key: string) => void;
  isHidden: (key: string) => boolean;
}

export function useSectionVisibility(
  profileId: string | null | undefined,
): SectionVisibility {
  const [hidden, setHidden] = useState<Set<string>>(() => readFromStorage(profileId));

  const toggle = useCallback(
    (key: string) => {
      setHidden((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        if (profileId) writeToStorage(profileId, next);
        return next;
      });
    },
    [profileId],
  );

  const isHidden = useCallback((key: string) => hidden.has(key), [hidden]);

  return { hidden, toggle, isHidden };
}
