"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchProcedures } from "../lib/calendar.api";

export function useProcedures(rawSearch: string) {
  const [debouncedSearch, setDebouncedSearch] = useState(rawSearch);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(rawSearch), 250);
    return () => clearTimeout(id);
  }, [rawSearch]);

  return useQuery({
    queryKey: ["procedures", "lookup", debouncedSearch],
    queryFn: () => fetchProcedures(debouncedSearch || undefined),
    staleTime: 5 * 60 * 1000,
  });
}
