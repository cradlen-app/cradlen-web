import type { ReactNode } from "react";
import { fireEvent, screen } from "@testing-library/react";

import { renderWithIntl } from "@/test/render";

vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    className,
    onClick,
  }: {
    href: string;
    children: ReactNode;
    className?: string;
    onClick?: () => void;
  }) => (
    <a href={href} className={className} onClick={onClick}>
      {children}
    </a>
  ),
}));

import MarketingHeader from "./MarketingHeader";

describe("MarketingHeader", () => {
  it("renders the nav links and auth CTAs (desktop + mobile)", () => {
    renderWithIntl(<MarketingHeader />);

    // Each link is rendered once for the desktop nav and once for the mobile menu.
    expect(screen.getAllByText("Features")).toHaveLength(2);
    expect(screen.getAllByText("How it works")).toHaveLength(2);
    expect(screen.getAllByText("Pricing")).toHaveLength(2);
    expect(screen.getAllByText("Docs")).toHaveLength(2);
    expect(screen.getAllByText("Sign in")).toHaveLength(2);
    expect(screen.getAllByText("Start free")).toHaveLength(2);
  });

  it("toggles the mobile menu button label and aria-expanded", () => {
    renderWithIntl(<MarketingHeader />);

    const toggle = screen.getByRole("button", { name: "Open menu" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(toggle);

    const close = screen.getByRole("button", { name: "Close menu" });
    expect(close).toHaveAttribute("aria-expanded", "true");
  });
});
