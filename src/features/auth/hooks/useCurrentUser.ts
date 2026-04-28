import { useQuery } from "@tanstack/react-query";
import { apiAuthFetch } from "@/lib/api";
import type { CurrentUser } from "@/types/user.types";

export function useCurrentUser() {
  return useQuery({
    queryKey: ["currentUser"],
    queryFn: () =>
      apiAuthFetch<{ data: CurrentUser }>("/auth/me").then((r) => r.data),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}
