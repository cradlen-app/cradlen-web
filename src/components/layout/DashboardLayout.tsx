"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { STAFF_ROLE } from "@/features/auth/lib/auth.constants";
import { getActiveRole } from "@/features/auth/lib/current-user";
import { buildDashboardUrl } from "@/lib/routes";
import type { CurrentUser } from "@/types/user.types";
import { Navbar } from "../common/Navbar";
import { Sidebar } from "../common/Sidebar";
import { canAccessRoute, getCanonicalDashboardPath } from "./dashboard-access";

type Props = {
  children: React.ReactNode;
  initialUser?: CurrentUser | null;
};

export function DashboardLayout({ children, initialUser }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { orgId, branchId } = useParams<{ orgId: string; branchId: string }>();
  const { data: user, isLoading } = useCurrentUser(initialUser ?? undefined);
  const role = getActiveRole(user);

  useEffect(() => {
    if (isLoading || !role) return;

    if (role === "patient") {
      router.replace("/patient/dashboard");
      return;
    }

    if (role === STAFF_ROLE.UNKNOWN) {
      router.replace("/sign-in");
      return;
    }

    if (!canAccessRoute(role, getCanonicalDashboardPath(pathname))) {
      router.replace(buildDashboardUrl(orgId, branchId));
    }
  }, [isLoading, orgId, branchId, pathname, role, router]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
