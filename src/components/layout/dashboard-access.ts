import type { UserRole } from "@/types/user.types";

type StaffRole = Exclude<UserRole, "patient">;

const ALLOWED_DASHBOARD_ROUTES: Record<StaffRole, string[]> = {
  owner: ["/dashboard"],
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
  if (role === "patient") return false;
  if (role === "owner") return true;

  return ALLOWED_DASHBOARD_ROUTES[role].some(
    (route) =>
      route === "/dashboard"
        ? pathname === route
        : pathname === route || pathname.startsWith(`${route}/`),
  );
}
