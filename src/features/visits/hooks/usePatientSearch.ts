// TEMP: API integration disabled during kernel refactor. Restore from git history when re-integrating.
"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { queryKeys } from "@/lib/queryKeys";
import { mockPatients } from "../lib/visits.mock";

export function usePatientSearch(rawSearch: string) {
  const [debouncedSearch, setDebouncedSearch] = useState(rawSearch);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(rawSearch), 300);
    return () => clearTimeout(id);
  }, [rawSearch]);

  return useQuery({
    queryKey: queryKeys.patients.search(debouncedSearch),
    queryFn: async () => {
      const term = debouncedSearch.trim().toLowerCase();
      if (!term) return mockPatients;
      return mockPatients.filter((p) =>
        [p.fullName, p.nationalId, p.phoneNumber]
          .filter(Boolean)
          .some((field) => field!.toLowerCase().includes(term)),
      );
    },
    enabled: debouncedSearch.trim().length >= 2,
    staleTime: Infinity,
  });
}
