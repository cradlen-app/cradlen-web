"use client";

import { useState } from "react";
import type { Patient } from "@/features/visits/types/visits.types";

export function usePatientsDirectory(patients: Patient[]) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const visibleSelectedId = patients.some((p) => p.id === selectedId) ? selectedId : null;
  return { selectedId: visibleSelectedId, setSelectedId };
}
