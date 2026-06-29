"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { searchPatients } from "../lib/visits.api";
import { mapApiPatientSearchResultToPatient } from "../lib/visits.utils";

export function usePatientSearch(rawSearch: string) {
  const [debouncedSearch, setDebouncedSearch] = useState(rawSearch);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(rawSearch), 300);
    return () => clearTimeout(id);
  }, [rawSearch]);

  return useQuery({
    queryKey: queryKeys.patients.search(debouncedSearch),
    queryFn: async () => {
      const res = await searchPatients(debouncedSearch);
      return res.data.map(mapApiPatientSearchResultToPatient);
    },
    enabled: debouncedSearch.trim().length >= 2,
  });
}