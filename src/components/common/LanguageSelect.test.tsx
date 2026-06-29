import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

const hoisted = vi.hoisted(() => ({
  replace: vi.fn(),
  pathname: "/dashboard",
  searchParams: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => hoisted.searchParams,
}));

vi.mock("@/i18n/navigation", () => ({
  usePathname: () => hoisted.pathname,
  useRouter: () => ({ replace: hoisted.replace }),
}));

vi.mock("@/i18n/LocaleDocumentSync", () => ({
  getLocaleDirection: (locale: string) => (locale === "ar" ? "rtl" : "ltr"),
}));

import LanguageSelect from "./LanguageSelect";

describe("LanguageSelect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hoisted.pathname = "/dashboard";
    hoisted.searchParams = new URLSearchParams();
  });

  afterEach(() => vi.restoreAllMocks());

  it("renders both language options with the current one selected", () => {
    render(<LanguageSelect currentLocale="en" />);
    const select = screen.getByLabelText("Change language") as HTMLSelectElement;
    expect(select.value).toBe("en");
    expect(screen.getByRole("option", { name: "En" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "ع" })).toBeInTheDocument();
  });

  it("switches locale and updates the document direction on change", () => {
    render(<LanguageSelect currentLocale="en" />);
    fireEvent.change(screen.getByLabelText("Change language"), {
      target: { value: "ar" },
    });

    expect(hoisted.replace).toHaveBeenCalledWith("/dashboard", { locale: "ar" });
    expect(document.documentElement.lang).toBe("ar");
    expect(document.documentElement.dir).toBe("rtl");
  });

  it("preserves the query string when switching locale", () => {
    hoisted.searchParams = new URLSearchParams({ tab: "billing" });
    render(<LanguageSelect currentLocale="en" />);
    fireEvent.change(screen.getByLabelText("Change language"), {
      target: { value: "ar" },
    });
    expect(hoisted.replace).toHaveBeenCalledWith("/dashboard?tab=billing", {
      locale: "ar",
    });
  });

  it("no-ops when selecting the already-active locale", () => {
    render(<LanguageSelect currentLocale="en" />);
    fireEvent.change(screen.getByLabelText("Change language"), {
      target: { value: "en" },
    });
    expect(hoisted.replace).not.toHaveBeenCalled();
  });
});
