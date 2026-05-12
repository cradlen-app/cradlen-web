"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useLogout } from "@/components/common/hooks/useLogout";
import type { CurrentUser } from "@/common/types/user.types";
import { getActiveProfile, getProfileOrganization } from "../lib/current-user";

// Defensive guard. The backend should filter inactive orgs at the JWT-strategy
// layer, so this should never trigger; if it ever does (race between offboarding
// and a live session), force the user out cleanly instead of letting them
// operate on a frozen organization.
export function useOrgStatusGuard(user: CurrentUser | undefined) {
  const t = useTranslations("auth.signIn.errors");
  const { handleLogout } = useLogout();

  useEffect(() => {
    if (!user) return;
    const profile = getActiveProfile(user);
    const status = getProfileOrganization(profile)?.status;
    if (!status) return;
    if (status.toUpperCase() === "ACTIVE") return;

    toast.error(t("inactiveOrganization"));
    void handleLogout();
  }, [user, handleLogout, t]);
}
