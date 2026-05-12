import { apiAuthFetch } from "@/infrastructure/http/api";
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

export const fetchSpecialtiesLookup = () =>
  apiAuthFetch<ApiResponse<SpecialtyLookup[]>>("/specialties/lookup");

export const fetchJobFunctionsLookup = () =>
  apiAuthFetch<ApiResponse<JobFunctionLookup[]>>("/job-functions/lookup");

export const fetchProfileLookups = () =>
  apiAuthFetch<ApiResponse<ProfileLookups>>("/profiles/lookups");
