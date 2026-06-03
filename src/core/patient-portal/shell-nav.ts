import {
  Home,
  ClipboardList,
  Pill,
  FlaskConical,
  CalendarDays,
  FileUp,
  User,
  type LucideIcon,
} from "lucide-react";

/**
 * Navigation for the patient portal's own responsive shell. Rendered as a
 * bottom tab bar on mobile and a left sidebar on desktop. These are NOT kernel
 * NavItems (the portal doesn't live in the staff dashboard sidebar).
 *
 * `labelKey` is relative to the `patientPortal` i18n namespace.
 */
export interface PortalNavItem {
  href: string;
  labelKey: string;
  icon: LucideIcon;
  /** Show in the mobile bottom tab bar (kept to 5 items max). */
  primary: boolean;
}

export const PORTAL_NAV: readonly PortalNavItem[] = [
  { href: "/patient", labelKey: "nav.home", icon: Home, primary: true },
  {
    href: "/patient/record",
    labelKey: "nav.record",
    icon: ClipboardList,
    primary: true,
  },
  {
    href: "/patient/medications",
    labelKey: "nav.medications",
    icon: Pill,
    primary: true,
  },
  {
    href: "/patient/tests",
    labelKey: "nav.tests",
    icon: FlaskConical,
    primary: true,
  },
  {
    href: "/patient/appointments",
    labelKey: "nav.appointments",
    icon: CalendarDays,
    primary: true,
  },
  {
    href: "/patient/documents",
    labelKey: "nav.documents",
    icon: FileUp,
    primary: false,
  },
  {
    href: "/patient/profile",
    labelKey: "nav.profile",
    icon: User,
    primary: false,
  },
] as const;
