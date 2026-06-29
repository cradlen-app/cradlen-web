import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";

vi.mock("next-intl/server", () => ({
  getTranslations: async () => {
    const t = ((key: string) => key) as unknown as {
      (key: string): string;
      raw: (key: string) => unknown;
      has: (key: string) => boolean;
    };
    t.raw = (key: string) => {
      if (key.endsWith(".body")) return ["Paragraph one.", "Paragraph two."];
      if (key.endsWith(".bullets")) return ["Bullet A", "Bullet B"];
      return key;
    };
    // Only the first section advertises bullets.
    t.has = (key: string) => key === "sections.intro.bullets";
    return t;
  },
}));

vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={typeof href === "string" ? href : "#"}>{children}</a>
  ),
}));

vi.mock("./MarketingFooter", () => ({
  default: () => <footer data-testid="marketing-footer" />,
}));

vi.mock("./LegalTableOfContents", () => ({
  default: ({ label, items }: { label: string; items: { id: string }[] }) => (
    <nav data-testid="toc" aria-label={label} data-count={items.length} />
  ),
}));

import LegalDocument from "./LegalDocument";

describe("LegalDocument", () => {
  it("renders the title, intro and footer", async () => {
    render(
      await LegalDocument({ namespace: "terms", sectionIds: ["intro", "data"] }),
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "title" }),
    ).toBeInTheDocument();
    expect(screen.getByText("intro")).toBeInTheDocument();
    expect(screen.getByText("lastUpdated")).toBeInTheDocument();
    expect(screen.getByTestId("marketing-footer")).toBeInTheDocument();
  });

  it("renders a section per id with body paragraphs", async () => {
    render(
      await LegalDocument({ namespace: "terms", sectionIds: ["intro", "data"] }),
    );

    expect(
      screen.getByRole("heading", { level: 2, name: "sections.intro.heading" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "sections.data.heading" }),
    ).toBeInTheDocument();

    // Body paragraphs are repeated per section (2 sections x 2 paragraphs).
    expect(screen.getAllByText("Paragraph one.")).toHaveLength(2);
  });

  it("renders bullets only for sections that have them", async () => {
    render(
      await LegalDocument({ namespace: "terms", sectionIds: ["intro", "data"] }),
    );

    // Only the intro section declares bullets via t.has().
    expect(screen.getByText("Bullet A")).toBeInTheDocument();
    expect(screen.getByText("Bullet B")).toBeInTheDocument();
    expect(screen.getAllByText("Bullet A")).toHaveLength(1);
  });

  it("passes the table-of-contents items to the TOC component", async () => {
    render(
      await LegalDocument({ namespace: "terms", sectionIds: ["intro", "data"] }),
    );
    expect(screen.getByTestId("toc")).toHaveAttribute("data-count", "2");
  });
});
