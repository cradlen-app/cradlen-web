import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../store/authStore";
import { apiAuthFetch } from "@/lib/api";
import type { CurrentUser } from "@/types/user.types";

export function useCurrentUser() {
  const hasToken = useAuthStore(
    (s) => !!s.tokens?.access_token || !!s.tokens?.refresh_token,
  );
  return useQuery({
    queryKey: ["currentUser"],
    queryFn: () =>
      apiAuthFetch<{ data: CurrentUser }>("/auth/me").then((r) => r.data),
    enabled: hasToken,
    staleTime: 5 * 60 * 1000,
  });
}
