"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { useOrgStatusGuard } from "@/features/auth/hooks/useOrgStatusGuard";
import { getActiveProfile, getProfileRoles } from "@/features/auth/lib/current-user";
import { hasAnyStaffRole } from "@/features/auth/lib/permissions";
import { getDefaultRouteForRole } from "@/features/auth/lib/redirect";
import type { CurrentUser } from "@/common/types/user.types";
import { SubscriptionBanner } from "@/features/subscriptions/components/SubscriptionBanner";
import { Navbar } from "../common/Navbar";
import { Sidebar } from "../common/Sidebar";
import { StaffBottomTabs } from "../common/StaffBottomTabs";
import Footer from "../common/Footer";
import { canAccessRoute, getCanonicalDashboardPath } from "./dashboard-access";
import { SidebarProvider } from "./SidebarContext";

type Props = {
  children: React.ReactNode;
  initialUser?: CurrentUser | null;
};

function DashboardLayoutInner({ children, initialUser }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { orgId, branchId } = useParams<{ orgId: string; branchId: string }>();
  const { data: user, isLoading } = useCurrentUser(initialUser ?? undefined);
  const profile = getActiveProfile(user);

  useOrgStatusGuard(user);

  useEffect(() => {
    if (isLoading || !user) return;

    if (!hasAnyStaffRole(profile)) {
      router.replace("/sign-in");
      return;
    }

    if (!canAccessRoute(profile, getCanonicalDashboardPath(pathname))) {
      const role = getProfileRoles(profile)[0];
      router.replace(getDefaultRouteForRole(role, orgId, branchId, profile));
    }
  }, [isLoading, orgId, branchId, pathname, profile, router, user]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Navbar />
      <SubscriptionBanner />
      <div className="flex flex-1 overflow-hidden lg:pb-3">
        {/* Sidebar — desktop only; mobile navigation uses the bottom tab bar. */}
        <div className="hidden shrink-0 lg:relative lg:block">
          <Sidebar />
        </div>
        <main className="min-w-0 flex-1 overflow-y-auto pb-20 lg:pb-0">{children}</main>
      </div>
      <StaffBottomTabs />
      <div className="hidden lg:block">
        <Footer />
      </div>
    </div>
  );
}

export function DashboardLayout({ children, initialUser }: Props) {
  return (
    <SidebarProvider>
      <DashboardLayoutInner initialUser={initialUser}>
        {children}
      </DashboardLayoutInner>
    </SidebarProvider>
  );
}
