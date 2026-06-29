import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiAuthFetch } from "@/infrastructure/http/api";
import {
  activateService,
  createService,
  deactivateService,
  deleteService,
  fetchService,
  fetchServices,
  updateService,
} from "./services.api";

vi.mock("@/infrastructure/http/api", () => ({
  apiAuthFetch: vi.fn(),
}));

const mockFetch = vi.mocked(apiAuthFetch);

beforeEach(() => {
  vi.clearAllMocks();
  mockFetch.mockResolvedValue({ data: {}, meta: {} });
});

const CATALOG = "/organizations/org-1/financial/catalog/services";

describe("fetchServices", () => {
  it("serializes all filters", async () => {
    await fetchServices("org-1", {
      service_type: "PROCEDURE",
      specialty_id: "sp-1",
      active: false,
      page: 3,
      limit: 25,
    });
    expect(mockFetch).toHaveBeenCalledWith(
      `${CATALOG}?service_type=PROCEDURE&specialty_id=sp-1&active=false&page=3&limit=25`,
    );
  });

  it("omits the query string when no filters are passed", async () => {
    await fetchServices("org-1");
    expect(mockFetch).toHaveBeenCalledWith(CATALOG);
  });
});

describe("fetchService", () => {
  it("fetches by id", async () => {
    await fetchService("org-1", "s-1");
    expect(mockFetch).toHaveBeenCalledWith(`${CATALOG}/s-1`);
  });
});

describe("write operations", () => {
  it("createService POSTs the payload", async () => {
    const payload = { name: "X" } as never;
    await createService("org-1", payload);
    expect(mockFetch).toHaveBeenCalledWith(CATALOG, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  });

  it("updateService PATCHes by id", async () => {
    const payload = { name: "Y" } as never;
    await updateService("org-1", "s-1", payload);
    expect(mockFetch).toHaveBeenCalledWith(`${CATALOG}/s-1`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  });

  it("deleteService DELETEs by id", async () => {
    await deleteService("org-1", "s-1");
    expect(mockFetch).toHaveBeenCalledWith(`${CATALOG}/s-1`, { method: "DELETE" });
  });

  it("activateService POSTs to the activate sub-path", async () => {
    await activateService("org-1", "s-1");
    expect(mockFetch).toHaveBeenCalledWith(`${CATALOG}/s-1/activate`, {
      method: "POST",
    });
  });

  it("deactivateService POSTs to the deactivate sub-path", async () => {
    await deactivateService("org-1", "s-1");
    expect(mockFetch).toHaveBeenCalledWith(`${CATALOG}/s-1/deactivate`, {
      method: "POST",
    });
  });
});
