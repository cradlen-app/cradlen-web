import type { UserRole } from "@/types/user.types";

type StaffRole = "owner" | "doctor" | "reception" | "receptionist";

const ALLOWED_DASHBOARD_ROUTES: Record<StaffRole, string[]> = {
  owner: ["/dashboard"],
  reception: ["/dashboard", "/dashboard/calendar", "/dashboard/patients", "/dashboard/staff"],
  receptionist: ["/dashboard", "/dashboard/calendar", "/dashboard/patients", "/dashboard/staff"],
  doctor: [
    "/dashboard",
    "/dashboard/calendar",
    "/dashboard/patients",
    "/dashboard/medicine",
    "/dashboard/settings",
  ],
};

export function canAccessRoute(role: UserRole, pathname: string) {
  if (role === "patient" || role === "unknown") return false;
  if (role === "owner") return true;

  return ALLOWED_DASHBOARD_ROUTES[role].some(
    (route) =>
      route === "/dashboard"
        ? pathname === route
        : pathname === route || pathname.startsWith(`${route}/`),
  );
}
