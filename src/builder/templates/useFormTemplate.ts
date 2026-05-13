"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { fetchFormTemplate } from "./templates.api";

export function useFormTemplate(
  code: string,
  enabled = true,
  extension?: string | null,
) {
  return useQuery({
    queryKey: queryKeys.formTemplates.byCode(code, extension),
    queryFn: () => fetchFormTemplate(code, extension),
    staleTime: Infinity,
    enabled,
  });
}
