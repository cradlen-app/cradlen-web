import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={typeof href === "string" ? href : "#"}>{children}</a>
  ),
}));

import { Breadcrumbs, type Crumb } from "./breadcrumbs";

const items: Crumb[] = [
  { label: "Home", href: "/" },
  { label: "Patients", href: "/patients" },
  { label: "Jane Doe" },
];

describe("Breadcrumbs", () => {
  it("renders earlier crumbs with hrefs as links", () => {
    render(<Breadcrumbs items={items} ariaLabel="trail" />);
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Patients" })).toHaveAttribute(
      "href",
      "/patients",
    );
  });

  it("renders the last crumb as plain text, not a link", () => {
    render(<Breadcrumbs items={items} />);
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Jane Doe" })).not.toBeInTheDocument();
  });

  it("does not link the final crumb even when it has an href", () => {
    render(
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Current", href: "/current" },
        ]}
      />,
    );
    expect(screen.queryByRole("link", { name: "Current" })).not.toBeInTheDocument();
  });

  it("applies the provided aria-label to the nav", () => {
    render(<Breadcrumbs items={items} ariaLabel="Breadcrumb" />);
    expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toBeInTheDocument();
  });
});
