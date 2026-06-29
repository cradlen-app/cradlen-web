import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiAuthFetch } from "@/infrastructure/http/api";
import {
  fetchMedRepBranchInProgress,
  fetchMedRepBranchWaitingList,
  fetchMedRepMyCurrent,
  fetchMedRepMyWaitingList,
  fetchMedRepVisit,
  updateMedRepVisit,
  updateMedRepVisitStatus,
} from "./medical-rep.api";

vi.mock("@/infrastructure/http/api", () => ({
  apiAuthFetch: vi.fn(),
}));

const mockFetch = vi.mocked(apiAuthFetch);
const lastUrl = () => mockFetch.mock.calls.at(-1)?.[0] as string;
const lastInit = () => mockFetch.mock.calls.at(-1)?.[1] as RequestInit | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  mockFetch.mockResolvedValue({ data: [] } as never);
});

describe("medical-rep list reads", () => {
  it("waiting-list without pagination", async () => {
    await fetchMedRepBranchWaitingList({ branchId: "br-1" });
    expect(lastUrl()).toBe("/branches/br-1/medical-rep-visits/waiting-list");
  });

  it("waiting-list with page + limit", async () => {
    await fetchMedRepBranchWaitingList({ branchId: "br-1", page: 2, limit: 7 });
    expect(lastUrl()).toBe(
      "/branches/br-1/medical-rep-visits/waiting-list?page=2&limit=7",
    );
  });

  it("in-progress with limit only", async () => {
    await fetchMedRepBranchInProgress({ branchId: "br-1", limit: 4 });
    expect(lastUrl()).toBe("/branches/br-1/medical-rep-visits/in-progress?limit=4");
  });

  it("my-waiting-list forwards rest pagination params", async () => {
    await fetchMedRepMyWaitingList({ branchId: "br-1", page: 3 });
    expect(lastUrl()).toBe("/branches/br-1/medical-rep-visits/my-waiting-list?page=3");
  });

  it("my-current targets the right route", async () => {
    await fetchMedRepMyCurrent("br-1");
    expect(lastUrl()).toBe("/branches/br-1/medical-rep-visits/my-current");
  });

  it("single visit by id", async () => {
    await fetchMedRepVisit({ visitId: "mrv-1" });
    expect(lastUrl()).toBe("/medical-rep-visits/mrv-1");
  });
});

describe("medical-rep writes", () => {
  it("updateMedRepVisit PATCHes the serialized body", async () => {
    await updateMedRepVisit({ visitId: "mrv-1", body: { notes: "follow up" } });
    expect(lastUrl()).toBe("/medical-rep-visits/mrv-1");
    expect(lastInit()).toMatchObject({
      method: "PATCH",
      body: JSON.stringify({ notes: "follow up" }),
    });
  });

  it("updateMedRepVisitStatus PATCHes the status route", async () => {
    await updateMedRepVisitStatus({
      visitId: "mrv-1",
      body: { status: "COMPLETED" },
    });
    expect(lastUrl()).toBe("/medical-rep-visits/mrv-1/status");
    expect(lastInit()).toMatchObject({
      method: "PATCH",
      body: JSON.stringify({ status: "COMPLETED" }),
    });
  });
});
