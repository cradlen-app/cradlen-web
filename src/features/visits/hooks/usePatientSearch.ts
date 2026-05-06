"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { searchPatients } from "../lib/visits.api";
import { mapApiPatientToPatient } from "../lib/visits.utils";

export function usePatientSearch(rawSearch: string) {
  const [debouncedSearch, setDebouncedSearch] = useState(rawSearch);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(rawSearch), 300);
    return () => clearTimeout(id);
  }, [rawSearch]);

  return useQuery({
    queryKey: ["patients", "search", debouncedSearch],
    queryFn: async () => {
      const res = await searchPatients(debouncedSearch);
      return res.data.map(mapApiPatientToPatient);
    },
    enabled: debouncedSearch.trim().length >= 2,
    staleTime: 30_000,
  });
}
