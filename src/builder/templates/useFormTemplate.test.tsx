import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchFormTemplate } from "./templates.api";
import { useFormTemplate } from "./useFormTemplate";

vi.mock("./templates.api", () => ({ fetchFormTemplate: vi.fn() }));

const mockFetch = vi.mocked(fetchFormTemplate);

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <NextIntlClientProvider locale="en" messages={{}}>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </NextIntlClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockFetch.mockResolvedValue({ id: "tpl-1", code: "book_visit" } as never);
});

describe("useFormTemplate", () => {
  it("fetches and returns the template by code", async () => {
    const { result } = renderHook(() => useFormTemplate("book_visit"), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockFetch).toHaveBeenCalledWith("book_visit", undefined);
    expect(result.current.data).toEqual({ id: "tpl-1", code: "book_visit" });
  });

  it("forwards an extension argument to the fetcher", async () => {
    const { result } = renderHook(() => useFormTemplate("book_visit", true, "clinical"), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockFetch).toHaveBeenCalledWith("book_visit", "clinical");
  });

  it("does not fetch when disabled", () => {
    const { result } = renderHook(() => useFormTemplate("book_visit", false), { wrapper });
    expect(result.current.fetchStatus).toBe("idle");
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
