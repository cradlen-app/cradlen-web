"use client";

import { useQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import { queryKeys } from "@/lib/queryKeys";
import { fetchFormTemplate } from "./templates.api";

export function useFormTemplate(
  code: string,
  enabled = true,
  extension?: string | null,
) {
  // The backend localizes template labels per Accept-Language (set by
  // apiAuthFetch from the active locale). Key the cache by locale so switching
  // language refetches instead of serving the other language's cached copy.
  const locale = useLocale();
  return useQuery({
    queryKey: queryKeys.formTemplates.byCode(code, extension, locale),
    queryFn: () => fetchFormTemplate(code, extension),
    staleTime: Infinity,
    enabled,
  });
}
