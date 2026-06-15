import { apiAuthFetch, apiFetch } from "@/infrastructure/http/api";
import type { ApiResponse } from "@/common/types/api.types";

export type SpecialtyLookup = { code: string; name: string };
export type JobFunctionLookup = {
  code: string;
  name: string;
  is_clinical: boolean;
};
export type EnumLookup = { code: string; name: string };
export type ProfileLookups = {
  executive_titles: EnumLookup[];
  engagement_types: EnumLookup[];
};

// Fetched via the public same-origin proxy (not the authenticated one) so it
// also works during signup step 3, where the user has no auth token yet. The
// backend endpoint is public; we forward the active UI locale for localized
// names.
export const fetchSpecialtiesLookup = () =>
  apiFetch<ApiResponse<SpecialtyLookup[]>>("/api/specialties/lookup", {
    headers: {
      "Accept-Language":
        typeof document !== "undefined" && document.documentElement.lang
          ? document.documentElement.lang
          : "en",
    },
  });

export const fetchJobFunctionsLookup = () =>
  apiAuthFetch<ApiResponse<JobFunctionLookup[]>>("/job-functions/lookup");

export const fetchProfileLookups = () =>
  apiAuthFetch<ApiResponse<ProfileLookups>>("/profiles/lookups");
