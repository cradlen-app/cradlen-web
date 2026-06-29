import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiAuthFetch } from "@/infrastructure/http/api";
import {
  createCategory,
  deleteCategory,
  fetchCategories,
  updateCategory,
} from "./categories.api";

vi.mock("@/infrastructure/http/api", () => ({
  apiAuthFetch: vi.fn(),
}));

const mockFetch = vi.mocked(apiAuthFetch);
const BASE = "/organizations/org-1/financial/catalog/categories";

beforeEach(() => {
  vi.clearAllMocks();
  mockFetch.mockResolvedValue({ data: {}, meta: {} });
});

describe("fetchCategories", () => {
  it("serializes active/page/limit options", async () => {
    await fetchCategories("org-1", { active: true, page: 1, limit: 5 });
    expect(mockFetch).toHaveBeenCalledWith(`${BASE}?active=true&page=1&limit=5`);
  });

  it("omits the query string when no options are passed", async () => {
    await fetchCategories("org-1");
    expect(mockFetch).toHaveBeenCalledWith(BASE);
  });

  it("serializes active=false (not skipped by truthiness)", async () => {
    await fetchCategories("org-1", { active: false });
    expect(mockFetch).toHaveBeenCalledWith(`${BASE}?active=false`);
  });
});

describe("write operations", () => {
  it("createCategory POSTs to the base", async () => {
    const payload = { name: "Lab" } as never;
    await createCategory("org-1", payload);
    expect(mockFetch).toHaveBeenCalledWith(BASE, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  });

  it("updateCategory PATCHes by id", async () => {
    const payload = { name: "Imaging" } as never;
    await updateCategory("org-1", "cat-1", payload);
    expect(mockFetch).toHaveBeenCalledWith(`${BASE}/cat-1`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  });

  it("deleteCategory DELETEs by id", async () => {
    await deleteCategory("org-1", "cat-1");
    expect(mockFetch).toHaveBeenCalledWith(`${BASE}/cat-1`, { method: "DELETE" });
  });
});
