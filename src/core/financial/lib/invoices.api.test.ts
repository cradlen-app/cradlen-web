import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiAuthFetch } from "@/infrastructure/http/api";
import { fetchInvoices } from "./invoices.api";

vi.mock("@/infrastructure/http/api", () => ({
  apiAuthFetch: vi.fn(),
}));

describe("fetchInvoices query building", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiAuthFetch).mockResolvedValue({ data: [], meta: {} });
  });

  it("serializes status, search, page and limit into the query string", async () => {
    await fetchInvoices("org-1", {
      status: "ISSUED",
      search: "ali",
      page: 2,
      limit: 10,
    });

    expect(apiAuthFetch).toHaveBeenCalledWith(
      "/organizations/org-1/invoices?status=ISSUED&search=ali&page=2&limit=10",
    );
  });

  it("omits the query string entirely when no filters are given", async () => {
    await fetchInvoices("org-1");

    expect(apiAuthFetch).toHaveBeenCalledWith("/organizations/org-1/invoices");
  });

  it("omits search when it is empty/undefined", async () => {
    await fetchInvoices("org-1", { page: 1, limit: 20 });

    expect(apiAuthFetch).toHaveBeenCalledWith(
      "/organizations/org-1/invoices?page=1&limit=20",
    );
  });

  it("passes pagination meta through from the response", async () => {
    vi.mocked(apiAuthFetch).mockResolvedValue({
      data: [],
      meta: { total: 5, page: 1, limit: 10, totalPages: 1 },
    });

    const res = await fetchInvoices("org-1", { search: "x" });

    expect(res.meta).toEqual({ total: 5, page: 1, limit: 10, totalPages: 1 });
  });
});
