"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { getActiveRole } from "@/features/auth/lib/current-user";
import type { UserRole } from "@/types/user.types";
import { Navbar } from "../common/Navbar";
import { Sidebar } from "../common/Sidebar";

type Props = {
  children: React.ReactNode;
};

const ALLOWED_DASHBOARD_ROUTES: Record<UserRole, string[]> = {
  owner: ["/dashboard"],
  receptionist: ["/dashboard", "/dashboard/calendar", "/dashboard/patients"],
  doctor: [
    "/dashboard",
    "/dashboard/calendar",
    "/dashboard/patients",
    "/dashboard/medicine",
  ],
};

function canAccessRoute(role: UserRole, pathname: string) {
  if (role === "owner") return true;

  return ALLOWED_DASHBOARD_ROUTES[role].some(
    (route) =>
      route === "/dashboard"
        ? pathname === route
        : pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function DashboardLayout({ children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: user, isLoading } = useCurrentUser();
  const role = getActiveRole(user);

  useEffect(() => {
    if (isLoading || !role) return;

    if (!canAccessRoute(role, pathname)) {
      router.replace("/dashboard");
    }
  }, [isLoading, pathname, role, router]);

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
