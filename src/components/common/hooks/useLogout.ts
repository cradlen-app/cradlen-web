"use client";

import { useRouter } from "@/i18n/navigation";
import { queryClient } from "@/lib/queryClient";
import { useUserStore } from "@/features/auth/store/userStore";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { clearPendingProfileSelection } from "@/features/auth/lib/profile-selection-session";
import { useAvailableProfilesStore } from "@/features/auth/store/availableProfilesStore";

export function useLogout() {
  const router = useRouter();
  const clearUser = useUserStore((s) => s.clearUser);
  const clearSession = useAuthStore((s) => s.clearSession);
  const clearContext = useAuthContextStore((s) => s.clearContext);
  const clearAvailableProfiles = useAvailableProfilesStore(
    (s) => s.clearAvailableProfiles,
  );

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // proceed with local logout even if the API call fails
    }
    clearSession();
    clearContext();
    clearUser();
    clearPendingProfileSelection();
    clearAvailableProfiles();
    queryClient.clear();
    router.replace("/sign-in");
  }

  return { handleLogout };
}
