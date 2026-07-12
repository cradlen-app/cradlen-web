import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";

vi.mock("next-intl/server", () => ({
  getTranslations: async () => ((key: string) => key) as unknown,
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={typeof href === "string" ? href : "#"}>{children}</a>
  ),
}));

import FinalCta from "./FinalCta";

describe("FinalCta", () => {
  it("renders the heading, description and both CTAs", async () => {
    render(await FinalCta());

    expect(
      screen.getByRole("heading", { level: 2, name: "heading" }),
    ).toBeInTheDocument();
    expect(screen.getByText("description")).toBeInTheDocument();

    expect(screen.getByRole("link", { name: /cta$/ })).toHaveAttribute(
      "href",
      "/sign-up",
    );
    // "Talk to us" goes to the contact page, not sign-in — a prospect clicking
    // it has not decided to create an account yet.
    expect(screen.getByRole("link", { name: "ctaSecondary" })).toHaveAttribute(
      "href",
      "/contact",
    );
  });
});
