"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { getActiveRole } from "@/features/auth/lib/current-user";
import { Navbar } from "../common/Navbar";
import { Sidebar } from "../common/Sidebar";
import { canAccessRoute } from "./dashboard-access";

type Props = {
  children: React.ReactNode;
};

export function DashboardLayout({ children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: user, isLoading } = useCurrentUser();
  const role = getActiveRole(user);

  useEffect(() => {
    if (isLoading || !role) return;

    if (role === "patient") {
      router.replace("/patient/dashboard");
      return;
    }

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
