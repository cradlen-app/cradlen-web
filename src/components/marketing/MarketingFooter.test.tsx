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

  it("renders internal links via the locale-aware Link and external anchors", async () => {
    render(await MarketingFooter());

    // Internal documentation link.
    expect(
      screen.getByRole("link", { name: "product.documentation" }),
    ).toHaveAttribute("href", "/guide");
    // Internal legal links.
    expect(screen.getByRole("link", { name: "legal.privacy" })).toHaveAttribute(
      "href",
      "/privacy-policy",
    );
    expect(
      screen.getByRole("link", { name: "company.helpCenter" }),
    ).toHaveAttribute("href", "/help-center");
    // External anchor (no internal flag).
    expect(screen.getByRole("link", { name: "product.features" })).toHaveAttribute(
      "href",
      "#features",
    );
  });

  it("passes the active locale to LanguageSelect", async () => {
    render(await MarketingFooter());
    expect(screen.getByTestId("language-select")).toHaveTextContent("en");
  });
});
