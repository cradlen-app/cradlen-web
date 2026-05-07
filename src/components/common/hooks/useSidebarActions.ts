"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "@/i18n/navigation";
import { useUserStore } from "@/features/auth/store/userStore";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";

export function useSidebarActions(
  branchMenuOpen: boolean,
  setBranchMenuOpen: (open: boolean) => void,
) {
  const router = useRouter();
  const clearUser = useUserStore((s) => s.clearUser);
  const clearSession = useAuthStore((s) => s.clearSession);
  const clearContext = useAuthContextStore((s) => s.clearContext);

  const branchMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!branchMenuOpen) return;
    function handler(e: MouseEvent) {
      if (!branchMenuRef.current?.contains(e.target as Node))
        setBranchMenuOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [branchMenuOpen, setBranchMenuOpen]);

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

  return { branchMenuRef, handleLogout };
}
