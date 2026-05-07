import { useQuery } from "@tanstack/react-query";
import { apiAuthFetch } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import type { CurrentUser } from "@/types/user.types";
import type { ApiResponse } from "@/types/api.types";

/** @deprecated Import `queryKeys.currentUser()` directly instead. */
export const CURRENT_USER_QUERY_KEY = queryKeys.currentUser();

export function useCurrentUser(initialData?: CurrentUser) {
  return useQuery({
    queryKey: queryKeys.currentUser(),
    queryFn: () =>
      apiAuthFetch<ApiResponse<CurrentUser>>("/auth/me").then((r) => r.data),
    retry: false,
    staleTime: 5 * 60 * 1000,
    initialData,
  });
}
