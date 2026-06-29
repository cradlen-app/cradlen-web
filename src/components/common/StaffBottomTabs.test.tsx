import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { Calendar, Stethoscope, Users } from "lucide-react";
import type { SidebarNavItem } from "./SidebarNav";

const hoisted = vi.hoisted(() => ({
  pathname: "/base/visits",
  isStaff: true,
  navItems: [] as SidebarNavItem[],
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: ReactNode;
    className?: string;
  }) => (
    <a href={typeof href === "string" ? href : "#"} className={className}>
      {children}
    </a>
  ),
  usePathname: () => hoisted.pathname,
}));

vi.mock("@/features/auth/hooks/useCurrentUser", () => ({
  useCurrentUser: () => ({ data: { first_name: "Jo", last_name: "Doe" } }),
}));

vi.mock("@/features/auth/lib/current-user", () => ({
  getActiveProfile: () => ({ profile_id: "p-1" }),
}));

vi.mock("@/features/auth/lib/permissions", () => ({
  hasAnyStaffRole: () => hoisted.isStaff,
}));

vi.mock("@/hooks/useDashboardPath", () => ({
  useDashboardPath: () => (p: string) => `/base${p}`,
}));

vi.mock("./staff-nav", () => ({
  useStaffNavItems: () => hoisted.navItems,
  STAFF_PRIMARY_TAB_PATHS: ["/visits", "/calendar", "/patients", "/staff"],
}));

vi.mock("./StaffMoreSheet", () => ({
  StaffMoreSheet: ({ open }: { open: boolean }) => (
    <div data-testid="more-sheet" data-open={open ? "true" : "false"} />
  ),
}));

import { StaffBottomTabs } from "./StaffBottomTabs";

const allItems: SidebarNavItem[] = [
  { path: "/visits", key: "nav.visits", icon: Stethoscope },
  { path: "/calendar", key: "nav.calendar", icon: Calendar },
  { path: "/patients", key: "nav.patients", icon: Users },
  { path: "/settings", key: "nav.settings", icon: Users },
];

describe("StaffBottomTabs", () => {
  beforeEach(() => {
    hoisted.pathname = "/base/visits";
    hoisted.isStaff = true;
    hoisted.navItems = allItems;
  });

  afterEach(() => vi.clearAllMocks());

  it("renders nothing for a non-staff user", () => {
    hoisted.isStaff = false;
    const { container } = render(<StaffBottomTabs />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders only the primary nav items present in the registry", () => {
    render(<StaffBottomTabs />);
    expect(screen.getByRole("link", { name: /nav.visits/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /nav.calendar/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /nav.patients/ })).toBeInTheDocument();
    // /settings is not a primary tab path → excluded.
    expect(screen.queryByRole("link", { name: /nav.settings/ })).not.toBeInTheDocument();
  });

  it("highlights the active tab via the brand-primary text colour", () => {
    hoisted.pathname = "/base/calendar";
    render(<StaffBottomTabs />);
    expect(screen.getByRole("link", { name: /nav.calendar/ }).className).toContain(
      "text-brand-primary",
    );
    expect(screen.getByRole("link", { name: /nav.visits/ }).className).not.toContain(
      "text-brand-primary",
    );
  });

  it("toggles the More sheet open via the More button", () => {
    render(<StaffBottomTabs />);
    const moreBtn = screen.getByRole("button", { name: /more/i });
    expect(moreBtn).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByTestId("more-sheet")).toHaveAttribute("data-open", "false");

    fireEvent.click(moreBtn);
    expect(moreBtn).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByTestId("more-sheet")).toHaveAttribute("data-open", "true");
  });
});
