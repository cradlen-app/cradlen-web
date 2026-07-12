import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";

vi.mock("next-intl/server", () => ({
  getTranslations: async () => ((key: string) => key) as unknown,
  getLocale: async () => "en",
}));

vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={typeof href === "string" ? href : "#"}>{children}</a>
  ),
}));

vi.mock("@/components/common/LanguageSelect", () => ({
  default: ({ currentLocale }: { currentLocale: string }) => (
    <div data-testid="language-select">{currentLocale}</div>
  ),
}));

import MarketingFooter from "./MarketingFooter";

describe("MarketingFooter", () => {
  it("renders the column labels and tagline", async () => {
    render(await MarketingFooter());

    expect(screen.getByText("productLabel")).toBeInTheDocument();
    expect(screen.getByText("companyLabel")).toBeInTheDocument();
    expect(screen.getByText("legalLabel")).toBeInTheDocument();
    expect(screen.getByText("tagline")).toBeInTheDocument();
    expect(screen.getByText("copyright")).toBeInTheDocument();
  });

  it("routes every link through the locale-aware Link", async () => {
    render(await MarketingFooter());

    expect(
      screen.getByRole("link", { name: "product.documentation" }),
    ).toHaveAttribute("href", "/guide");
    expect(screen.getByRole("link", { name: "legal.privacy" })).toHaveAttribute(
      "href",
      "/privacy-policy",
    );
    expect(
      screen.getByRole("link", { name: "company.helpCenter" }),
    ).toHaveAttribute("href", "/help-center");

    // The commercial pages the footer now links to.
    expect(screen.getByRole("link", { name: "product.pricing" })).toHaveAttribute(
      "href",
      "/pricing",
    );
    expect(screen.getByRole("link", { name: "company.about" })).toHaveAttribute(
      "href",
      "/about",
    );
    expect(screen.getByRole("link", { name: "company.contact" })).toHaveAttribute(
      "href",
      "/contact",
    );
  });

  it("roots section anchors at '/' so they work off the landing page", async () => {
    render(await MarketingFooter());

    // The footer renders on /pricing, /about and /contact too. A bare
    // "#features" would resolve against the *current* page and go nowhere.
    expect(screen.getByRole("link", { name: "product.features" })).toHaveAttribute(
      "href",
      "/#features",
    );
    expect(
      screen.getByRole("link", { name: "product.howItWorks" }),
    ).toHaveAttribute("href", "/#how-it-works");
  });

  it("has no dead links", async () => {
    render(await MarketingFooter());

    // "About" and "Why journeys" used to be href="#" placeholders.
    for (const link of screen.getAllByRole("link")) {
      expect(link.getAttribute("href")).not.toBe("#");
    }
  });

  it("passes the active locale to LanguageSelect", async () => {
    render(await MarketingFooter());
    expect(screen.getByTestId("language-select")).toHaveTextContent("en");
  });
});
