"use client";

import { useMutation } from "@tanstack/react-query";
import { checkConflicts } from "../lib/calendar.api";
import type { CheckConflictsRequest } from "../types/calendar.api.types";

export function useCheckConflicts() {
  return useMutation({
    mutationFn: (body: CheckConflictsRequest) => checkConflicts(body),
  });
}
