"use client";

import { useRouter } from "@/i18n/navigation";
import { useUserStore } from "@/features/auth/store/userStore";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";

export function useLogout() {
  const router = useRouter();
  const clearUser = useUserStore((s) => s.clearUser);
  const clearSession = useAuthStore((s) => s.clearSession);
  const clearContext = useAuthContextStore((s) => s.clearContext);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // proceed with local logout even if the API call fails
    }
    clearSession();
    clearContext();
    clearUser();
    router.replace("/sign-in");
  }

  return { handleLogout };
}
