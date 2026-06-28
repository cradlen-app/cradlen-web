import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";

const TIERS = [
  { name: "Free", price: "$0", period: "/mo", note: "n0", cta: "Get started", features: ["f0a", "f0b"] },
  { name: "Starter", price: "$19", period: "/mo", note: "n1", cta: "Get started", features: ["f1a"] },
  // Index 2 is the featured tier; empty period exercises the no-period branch.
  { name: "Pro", price: "$49", period: "", note: "n2", cta: "Get started", features: ["f2a", "f2b"] },
  { name: "Enterprise", price: "Custom", period: "", note: "n3", cta: "Contact sales", features: ["f3a"] },
];

vi.mock("next-intl/server", () => ({
  getTranslations: async () => {
    const t = ((key: string) => key) as unknown as {
      (key: string): string;
      raw: (key: string) => unknown;
    };
    t.raw = (key: string) => (key === "tiers" ? TIERS : key);
    return t;
  },
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={typeof href === "string" ? href : "#"}>{children}</a>
  ),
}));

import Pricing from "./Pricing";

describe("Pricing", () => {
  it("renders one card per tier with prices and CTAs", async () => {
    render(await Pricing());

    for (const tier of TIERS) {
      expect(
        screen.getByRole("heading", { level: 3, name: tier.name }),
      ).toBeInTheDocument();
      expect(screen.getByText(tier.price)).toBeInTheDocument();
    }

    expect(screen.getAllByText("Get started")).toHaveLength(3);
    expect(screen.getByText("Contact sales")).toBeInTheDocument();

    // Every CTA links to sign-up.
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(4);
    for (const link of links) {
      expect(link).toHaveAttribute("href", "/sign-up");
    }
  });

  it("marks the featured tier with the popular badge", async () => {
    render(await Pricing());
    expect(screen.getByText("popular")).toBeInTheDocument();
  });

  it("renders each tier's feature list", async () => {
    render(await Pricing());
    for (const feature of ["f0a", "f0b", "f1a", "f2a", "f2b", "f3a"]) {
      expect(screen.getByText(feature)).toBeInTheDocument();
    }
  });
});
