import type { UserRole } from "@/types/user.types";

const DEFAULT_AUTH_REDIRECT = "/dashboard";

export function getSafeRedirectPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return DEFAULT_AUTH_REDIRECT;
  }

  return value;
}

export function getDefaultRouteForRole(role: UserRole | undefined): string {
  switch (role) {
    case "doctor":
      return "/dashboard/calendar";
    case "receptionist":
      return "/dashboard/patients";
    case "patient":
      return "/patient/dashboard";
    default:
      return "/dashboard";
  }
}
