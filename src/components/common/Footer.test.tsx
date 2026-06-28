import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { renderWithIntl } from "@/test/render";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={typeof href === "string" ? href : "#"}>{children}</a>
  ),
  usePathname: () => "/",
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/i18n/LocaleDocumentSync", () => ({
  getLocaleDirection: () => "ltr",
}));

import Footer from "./Footer";

describe("Footer", () => {
  it("renders the legal/help links and the language switcher", () => {
    renderWithIntl(<Footer />);

    expect(
      screen.getByRole("link", { name: "Terms of Service" }),
    ).toHaveAttribute("href", "/terms-of-service");
    expect(screen.getByRole("link", { name: "Privacy Policy" })).toHaveAttribute(
      "href",
      "/privacy-policy",
    );
    expect(screen.getByRole("link", { name: "Help Center" })).toHaveAttribute(
      "href",
      "/help-center",
    );
    expect(screen.getByRole("link", { name: "User Guide" })).toHaveAttribute(
      "href",
      "/guide",
    );
    expect(screen.getByLabelText("Change language")).toBeInTheDocument();
  });

  it("renders the copyright line", () => {
    renderWithIntl(<Footer />);
    expect(screen.getByText(/CRADLEN/i)).toBeInTheDocument();
  });
});
