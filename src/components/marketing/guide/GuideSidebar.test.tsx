import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";

import GuideSidebar, { type GuideSidebarProps } from "./GuideSidebar";

vi.mock("@/i18n/navigation", () => ({
  usePathname: () => "/guide/dashboard",
  Link: ({
    href,
    children,
    onClick,
    className,
  }: {
    href: string;
    children: ReactNode;
    onClick?: () => void;
    className?: string;
  }) => (
    <a href={href} onClick={onClick} className={className}>
      {children}
    </a>
  ),
}));

const PROPS: GuideSidebarProps = {
  overview: { href: "/guide", label: "Overview" },
  sections: [
    {
      id: "features",
      title: "Features",
      items: [
        { href: "/guide/dashboard", label: "Dashboard" },
        { href: "/guide/visits", label: "Visits" },
      ],
    },
  ],
  whatsNew: { href: "/guide/whats-new", label: "What's new" },
  menuLabel: "User Guide",
};

describe("GuideSidebar", () => {
  it("renders overview, section items and whats-new in both mobile and desktop rails", () => {
    render(<GuideSidebar {...PROPS} />);

    // Each nav item appears twice (mobile <details> + desktop <aside>).
    expect(screen.getAllByText("Overview")).toHaveLength(2);
    expect(screen.getAllByText("Dashboard")).toHaveLength(2);
    expect(screen.getAllByText("Visits")).toHaveLength(2);
    expect(screen.getAllByText("What's new")).toHaveLength(2);

    // Section title + mobile disclosure label.
    expect(screen.getAllByText("Features")).toHaveLength(2);
    expect(screen.getByText("User Guide")).toBeInTheDocument();
  });

  it("highlights the link matching the active pathname", () => {
    render(<GuideSidebar {...PROPS} />);

    const dashboardLinks = screen.getAllByRole("link", { name: "Dashboard" });
    for (const link of dashboardLinks) {
      expect(link).toHaveClass("text-brand-primary");
    }

    // A non-active link does not get the active colour.
    const visitsLink = screen.getAllByRole("link", { name: "Visits" })[0];
    expect(visitsLink).not.toHaveClass("text-brand-primary");
  });
});
