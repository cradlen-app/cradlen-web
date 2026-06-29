import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiAuthFetch } from "@/infrastructure/http/api";
import {
  activatePriceList,
  addPriceListItem,
  authorizeProviderServices,
  createPriceList,
  createProviderOverride,
  deletePriceList,
  fetchPriceListItems,
  fetchPriceLists,
  fetchProviderOverrides,
  removePriceListItem,
  resolvePrice,
  setDefaultPriceList,
  setPriceListItems,
  updatePriceList,
  updatePriceListItem,
} from "./pricing.api";

vi.mock("@/infrastructure/http/api", () => ({
  apiAuthFetch: vi.fn(),
}));

const mockFetch = vi.mocked(apiAuthFetch);
const PL = "/organizations/org-1/financial/price-lists";

beforeEach(() => {
  vi.clearAllMocks();
  mockFetch.mockResolvedValue({ data: {}, meta: {} });
});

describe("price lists", () => {
  it("fetchPriceLists without branch omits the query string", async () => {
    await fetchPriceLists("org-1");
    expect(mockFetch).toHaveBeenCalledWith(PL);
  });

  it("fetchPriceLists with branch appends branch_id", async () => {
    await fetchPriceLists("org-1", "b-1");
    expect(mockFetch).toHaveBeenCalledWith(`${PL}?branch_id=b-1`);
  });

  it("createPriceList POSTs payload", async () => {
    const payload = { name: "Default" } as never;
    await createPriceList("org-1", payload);
    expect(mockFetch).toHaveBeenCalledWith(PL, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  });

  it("updatePriceList PATCHes by id", async () => {
    const payload = { name: "New" } as never;
    await updatePriceList("org-1", "pl-1", payload);
    expect(mockFetch).toHaveBeenCalledWith(`${PL}/pl-1`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  });

  it("deletePriceList DELETEs by id", async () => {
    await deletePriceList("org-1", "pl-1");
    expect(mockFetch).toHaveBeenCalledWith(`${PL}/pl-1`, { method: "DELETE" });
  });

  it("setDefaultPriceList / activatePriceList POST to action sub-paths", async () => {
    await setDefaultPriceList("org-1", "pl-1");
    expect(mockFetch).toHaveBeenCalledWith(`${PL}/pl-1/set-default`, {
      method: "POST",
    });
    await activatePriceList("org-1", "pl-1");
    expect(mockFetch).toHaveBeenCalledWith(`${PL}/pl-1/activate`, { method: "POST" });
  });
});

describe("price list items", () => {
  it("setPriceListItems PUTs the bulk payload", async () => {
    const payload = { items: [] } as never;
    await setPriceListItems("org-1", "pl-1", payload);
    expect(mockFetch).toHaveBeenCalledWith(`${PL}/pl-1/items`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  });

  it("fetchPriceListItems GETs the items collection", async () => {
    await fetchPriceListItems("org-1", "pl-1");
    expect(mockFetch).toHaveBeenCalledWith(`${PL}/pl-1/items`);
  });

  it("addPriceListItem POSTs to the items collection", async () => {
    const payload = { service_id: "s-1", price: 1 } as never;
    await addPriceListItem("org-1", "pl-1", payload);
    expect(mockFetch).toHaveBeenCalledWith(`${PL}/pl-1/items`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  });

  it("updatePriceListItem PATCHes the item by id", async () => {
    const payload = { price: 2 } as never;
    await updatePriceListItem("org-1", "pl-1", "it-1", payload);
    expect(mockFetch).toHaveBeenCalledWith(`${PL}/pl-1/items/it-1`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  });

  it("removePriceListItem DELETEs the item by id", async () => {
    await removePriceListItem("org-1", "pl-1", "it-1");
    expect(mockFetch).toHaveBeenCalledWith(`${PL}/pl-1/items/it-1`, {
      method: "DELETE",
    });
  });
});

describe("resolvePrice", () => {
  it("builds the query string without profileId", async () => {
    await resolvePrice("org-1", "svc-1", "b-1");
    expect(mockFetch).toHaveBeenCalledWith(
      "/organizations/org-1/financial/resolve-price?serviceId=svc-1&branchId=b-1",
    );
  });

  it("includes profileId when supplied", async () => {
    await resolvePrice("org-1", "svc-1", "b-1", "p-1");
    expect(mockFetch).toHaveBeenCalledWith(
      "/organizations/org-1/financial/resolve-price?serviceId=svc-1&branchId=b-1&profileId=p-1",
    );
  });
});

describe("provider overrides & services", () => {
  it("fetchProviderOverrides GETs the overrides collection", async () => {
    await fetchProviderOverrides("org-1", "p-1");
    expect(mockFetch).toHaveBeenCalledWith(
      "/organizations/org-1/providers/p-1/price-overrides",
    );
  });

  it("createProviderOverride POSTs the override payload", async () => {
    const payload = { service_id: "s-1", price: 5 } as never;
    await createProviderOverride("org-1", "p-1", payload);
    expect(mockFetch).toHaveBeenCalledWith(
      "/organizations/org-1/providers/p-1/price-overrides",
      { method: "POST", body: JSON.stringify(payload) },
    );
  });

  it("authorizeProviderServices POSTs to the batch endpoint", async () => {
    const payload = { service_ids: ["s-1"] } as never;
    await authorizeProviderServices("org-1", "p-1", payload);
    expect(mockFetch).toHaveBeenCalledWith(
      "/organizations/org-1/providers/p-1/services/batch",
      { method: "POST", body: JSON.stringify(payload) },
    );
  });
});
