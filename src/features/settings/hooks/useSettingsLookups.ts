import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import {
  fetchJobFunctionsLookup,
  fetchProfileLookups,
  fetchSpecialtiesLookup,
} from "../lib/lookups.api";

const ONE_HOUR = 60 * 60 * 1000;
const ONE_DAY = 24 * ONE_HOUR;

export function useSpecialtiesLookup() {
  return useQuery({
    queryKey: queryKeys.lookups.specialties(),
    queryFn: fetchSpecialtiesLookup,
    staleTime: ONE_HOUR,
    gcTime: ONE_DAY,
  });
}

export function useJobFunctionsLookup() {
  return useQuery({
    queryKey: queryKeys.lookups.jobFunctions(),
    queryFn: fetchJobFunctionsLookup,
    staleTime: ONE_HOUR,
    gcTime: ONE_DAY,
  });
}

export function useProfileLookups() {
  return useQuery({
    queryKey: queryKeys.lookups.profile(),
    queryFn: fetchProfileLookups,
    staleTime: ONE_HOUR,
    gcTime: ONE_DAY,
  });
}
