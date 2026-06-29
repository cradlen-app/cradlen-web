import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { Calendar, Home, Receipt, Wallet } from "lucide-react";

const hoisted = vi.hoisted(() => ({ pathname: "/base/dashboard" }));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    title,
    className,
  }: {
    href: string;
    children: ReactNode;
    title?: string;
    className?: string;
  }) => (
    <a href={typeof href === "string" ? href : "#"} title={title} className={className}>
      {children}
    </a>
  ),
  usePathname: () => hoisted.pathname,
}));

import { SidebarNav, type SidebarNavItem } from "./SidebarNav";

const dashboardPath = (p: string) => `/base${p}`;

const items: SidebarNavItem[] = [
  { path: "", key: "nav.dashboard", icon: Home },
  { path: "/calendar", key: "nav.calendar", icon: Calendar },
  {
    path: "/financial/invoices",
    key: "nav.invoices",
    icon: Receipt,
    group: { id: "financial", labelKey: "nav.financial", icon: Wallet },
  },
  {
    path: "/financial/reports",
    key: "nav.reports",
    icon: Receipt,
    group: { id: "financial", labelKey: "nav.financial", icon: Wallet },
  },
];

describe("SidebarNav", () => {
  it("renders ungrouped items as links with labels", () => {
    hoisted.pathname = "/base/calendar";
    render(<SidebarNav items={items} collapsed={false} dashboardPath={dashboardPath} />);
    expect(screen.getByRole("link", { name: "nav.dashboard" })).toHaveAttribute(
      "href",
      "/base",
    );
    expect(screen.getByRole("link", { name: "nav.calendar" })).toHaveAttribute(
      "href",
      "/base/calendar",
    );
  });

  it("highlights the active route with the brand-primary background", () => {
    hoisted.pathname = "/base/calendar";
    render(<SidebarNav items={items} collapsed={false} dashboardPath={dashboardPath} />);
    const active = screen.getByRole("link", { name: "nav.calendar" });
    expect(active.className).toContain("bg-brand-primary");
    const inactive = screen.getByRole("link", { name: "nav.dashboard" });
    expect(inactive.className).not.toContain("bg-brand-primary");
  });

  it("treats the root path as active only on an exact match", () => {
    hoisted.pathname = "/base/calendar";
    render(<SidebarNav items={items} collapsed={false} dashboardPath={dashboardPath} />);
    expect(
      screen.getByRole("link", { name: "nav.dashboard" }).className,
    ).not.toContain("bg-brand-primary");
  });

  it("collapses grouped items behind a toggle and expands on click", () => {
    hoisted.pathname = "/base/calendar";
    render(<SidebarNav items={items} collapsed={false} dashboardPath={dashboardPath} />);

    // Group is collapsed by default (no active child) → children hidden.
    expect(screen.queryByRole("link", { name: "nav.invoices" })).not.toBeInTheDocument();

    const groupBtn = screen.getByRole("button", { name: /nav.financial/ });
    expect(groupBtn).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(groupBtn);
    expect(groupBtn).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: "nav.invoices" })).toBeInTheDocument();
  });

  it("auto-expands a group when one of its children is the active route", () => {
    hoisted.pathname = "/base/financial/reports";
    render(<SidebarNav items={items} collapsed={false} dashboardPath={dashboardPath} />);
    const groupBtn = screen.getByRole("button", { name: /nav.financial/ });
    expect(groupBtn).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: "nav.reports" })).toBeInTheDocument();
  });

  it("renders grouped children as flat icon links when collapsed (no group button)", () => {
    hoisted.pathname = "/base/calendar";
    render(<SidebarNav items={items} collapsed dashboardPath={dashboardPath} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "nav.invoices" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "nav.reports" })).toBeInTheDocument();
  });
});
