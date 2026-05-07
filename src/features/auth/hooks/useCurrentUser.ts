import { useQuery } from "@tanstack/react-query";
import { apiAuthFetch } from "@/lib/api";
import type { CurrentUser } from "@/types/user.types";
import type { ApiResponse } from "@/types/api.types";

export const CURRENT_USER_QUERY_KEY = ["currentUser"] as const;

export function useCurrentUser() {
  return useQuery({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: () =>
      apiAuthFetch<ApiResponse<CurrentUser>>("/auth/me").then((r) => r.data),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}
