import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/infrastructure/http/api";
import { getJourneyClinical, patchJourneyClinical } from "./journey-clinical.api";
import {
  journeyClinicalKey,
  useJourneyClinical,
  usePatchJourneyClinical,
} from "./useJourneyClinical";

vi.mock("./journey-clinical.api", () => ({
  getJourneyClinical: vi.fn(),
  patchJourneyClinical: vi.fn(),
}));

function makeClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, retryDelay: 0 } },
  });
}

function wrapperFor(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("journeyClinicalKey", () => {
  it("composes a stable key tuple", () => {
    expect(journeyClinicalKey("v-1", "j-1")).toEqual([
      "journey-clinical",
      "v-1",
      "j-1",
    ]);
  });
});

describe("useJourneyClinical", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches the clinical envelope when both ids are present", async () => {
    const envelope = { journey_id: "j-1", version: 3 };
    vi.mocked(getJourneyClinical).mockResolvedValue({ data: envelope } as never);

    const { result } = renderHook(() => useJourneyClinical("v-1", "j-1"), {
      wrapper: wrapperFor(makeClient()),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(envelope);
    expect(getJourneyClinical).toHaveBeenCalledWith(
      "v-1",
      "j-1",
      expect.anything(),
    );
  });

  it("is disabled when either id is null", () => {
    const { result } = renderHook(() => useJourneyClinical("v-1", null), {
      wrapper: wrapperFor(makeClient()),
    });

    expect(result.current.fetchStatus).toBe("idle");
    expect(getJourneyClinical).not.toHaveBeenCalled();
  });

  it("does not retry a 404 response", async () => {
    vi.mocked(getJourneyClinical).mockRejectedValue(
      new ApiError(404, "Not found"),
    );

    const { result } = renderHook(() => useJourneyClinical("v-9", "j-9"), {
      wrapper: wrapperFor(makeClient()),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(getJourneyClinical).toHaveBeenCalledTimes(1);
  });
});

describe("usePatchJourneyClinical", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("patches and writes the result into the query cache", async () => {
    const updated = { journey_id: "j-1", version: 4 };
    vi.mocked(patchJourneyClinical).mockResolvedValue({
      data: updated,
    } as never);

    const queryClient = makeClient();
    const { result } = renderHook(
      () => usePatchJourneyClinical("v-1", "j-1"),
      { wrapper: wrapperFor(queryClient) },
    );

    await act(async () => {
      await result.current.mutateAsync({ body: { note: "hi" } });
    });

    expect(patchJourneyClinical).toHaveBeenCalledWith({
      visitId: "v-1",
      journeyId: "j-1",
      body: { note: "hi" },
    });
    expect(queryClient.getQueryData(journeyClinicalKey("v-1", "j-1"))).toEqual(
      updated,
    );
  });
});
