import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiAuthFetch } from "@/infrastructure/http/api";
import { fetchFormTemplate } from "./templates.api";

vi.mock("@/infrastructure/http/api", () => ({ apiAuthFetch: vi.fn() }));

const mockFetch = vi.mocked(apiAuthFetch);

beforeEach(() => {
  vi.clearAllMocks();
  mockFetch.mockResolvedValue({ data: { id: "tpl-1", code: "book_visit" } } as never);
});

describe("fetchFormTemplate", () => {
  it("fetches by code without an extension query and unwraps data", async () => {
    const tpl = await fetchFormTemplate("book_visit");
    expect(mockFetch).toHaveBeenCalledWith("/form-templates/book_visit");
    expect(tpl).toEqual({ id: "tpl-1", code: "book_visit" });
  });

  it("appends an URL-encoded extension query when provided", async () => {
    await fetchFormTemplate("book_visit", "ob gyn/clinical");
    expect(mockFetch).toHaveBeenCalledWith(
      "/form-templates/book_visit?extension=ob%20gyn%2Fclinical",
    );
  });

  it("omits the query when the extension is an empty string or null", async () => {
    await fetchFormTemplate("book_visit", "");
    await fetchFormTemplate("book_visit", null);
    expect(mockFetch).toHaveBeenNthCalledWith(1, "/form-templates/book_visit");
    expect(mockFetch).toHaveBeenNthCalledWith(2, "/form-templates/book_visit");
  });
});
