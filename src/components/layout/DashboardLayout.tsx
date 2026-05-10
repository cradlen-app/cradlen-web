"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { useOrgStatusGuard } from "@/features/auth/hooks/useOrgStatusGuard";
import { getActiveProfile } from "@/features/auth/lib/current-user";
import { hasAnyStaffRole } from "@/features/auth/lib/permissions";
import { buildDashboardUrl } from "@/lib/routes";
import { cn } from "@/lib/utils";
import type { CurrentUser } from "@/types/user.types";
import { Navbar } from "../common/Navbar";
import { Sidebar } from "../common/Sidebar";
import Footer from "../common/Footer";
import { canAccessRoute, getCanonicalDashboardPath } from "./dashboard-access";
import { SidebarProvider, useSidebar } from "./SidebarContext";

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
  const { mobileOpen, closeMobile } = useSidebar();

  useOrgStatusGuard(user);

  useEffect(() => {
    if (isLoading || !user) return;

    // Patient role is signalled separately on the profile shape; we keep the
    // legacy patient redirect for now.
    const profileRoleNames = (profile?.roles ?? []).map((r) =>
      typeof r === "string" ? r : r.name,
    );
    if (profileRoleNames.includes("patient")) {
      router.replace("/patient/dashboard");
      return;
    }

    if (!hasAnyStaffRole(profile)) {
      router.replace("/sign-in");
      return;
    }

    if (!canAccessRoute(profile, getCanonicalDashboardPath(pathname))) {
      router.replace(buildDashboardUrl(orgId, branchId));
    }
  }, [isLoading, orgId, branchId, pathname, profile, router, user]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        {mobileOpen && (
          <div
            className="fixed inset-0 top-16 z-30 bg-black/40 lg:hidden"
            onClick={closeMobile}
            aria-hidden="true"
          />
        )}
        <div
          className={cn(
            "fixed top-16 bottom-0 inset-s-0 z-40 shrink-0",
            "transition-transform duration-200 ease-in-out",
            "lg:relative lg:top-auto lg:bottom-auto lg:start-auto lg:z-auto lg:translate-x-0",
            mobileOpen
              ? "translate-x-0"
              : "-translate-x-full rtl:translate-x-full",
          )}
        >
          <Sidebar />
        </div>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
      <Footer />
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
