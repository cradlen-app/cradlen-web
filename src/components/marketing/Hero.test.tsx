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

vi.mock("./HeroMedia", () => ({
  default: () => <div data-testid="hero-media" />,
}));

import Hero from "./Hero";

describe("Hero", () => {
  it("renders eyebrow, title fragments, CTAs, trust line and strip", async () => {
    render(await Hero());

    expect(screen.getByText("eyebrow")).toBeInTheDocument();
    expect(screen.getByText("titleHighlight")).toBeInTheDocument();
    expect(screen.getByText("description")).toBeInTheDocument();

    // Primary CTA links to sign-up.
    const primary = screen.getByRole("link", { name: /ctaPrimary/ });
    expect(primary).toHaveAttribute("href", "/sign-up");

    // Secondary CTA jumps to the how-it-works anchor.
    const secondary = screen.getByRole("link", { name: /ctaSecondary/ });
    expect(secondary).toHaveAttribute("href", "#how-it-works");

    // Trust bullets.
    expect(screen.getByText("trust1")).toBeInTheDocument();
    expect(screen.getByText("trust2")).toBeInTheDocument();
    expect(screen.getByText("trust3")).toBeInTheDocument();

    // The three-item strip (from the home.strip namespace).
    expect(screen.getByText("item1")).toBeInTheDocument();
    expect(screen.getByText("item2")).toBeInTheDocument();
    expect(screen.getByText("item3")).toBeInTheDocument();

    // Hero media slot rendered.
    expect(screen.getByTestId("hero-media")).toBeInTheDocument();
  });
});
