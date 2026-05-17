"use client";

import { useCallback, useState } from "react";

// localStorage key — one entry per profile. Future: when a user_preferences
// API lands, swap the storage backend without touching consumers.
const KEY = (profileId: string) => `patientHistory.hiddenSections.${profileId}`;

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
  toggle: (sectionCode: string) => void;
  isHidden: (sectionCode: string) => boolean;
}

export function useSectionVisibility(
  profileId: string | null | undefined,
): SectionVisibility {
  const [hidden, setHidden] = useState<Set<string>>(() => readFromStorage(profileId));

  const toggle = useCallback(
    (sectionCode: string) => {
      setHidden((prev) => {
        const next = new Set(prev);
        if (next.has(sectionCode)) next.delete(sectionCode);
        else next.add(sectionCode);
        if (profileId) writeToStorage(profileId, next);
        return next;
      });
    },
    [profileId],
  );

  const isHidden = useCallback((sectionCode: string) => hidden.has(sectionCode), [hidden]);

  return { hidden, toggle, isHidden };
}