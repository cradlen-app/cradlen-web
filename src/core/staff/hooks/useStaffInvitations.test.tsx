import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import {
  deleteStaffInvitation,
  fetchStaffInvitation,
  fetchStaffInvitations,
  resendStaffInvitation,
} from "../lib/staff.api";
import { staffQueryKeys } from "../queryKeys";
import {
  useDeleteStaffInvitation,
  useResendStaffInvitation,
  useStaffInvitation,
  useStaffInvitations,
} from "./useStaffInvitations";

vi.mock("../lib/staff.api", () => ({
  fetchStaffInvitations: vi.fn(),
  fetchStaffInvitation: vi.fn(),
  resendStaffInvitation: vi.fn(),
  deleteStaffInvitation: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

function makeClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function wrapperFor(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("useStaffInvitations", () => {
  beforeEach(() => vi.clearAllMocks());

  it("unwraps a wrapped { data, meta } response", async () => {
    vi.mocked(fetchStaffInvitations).mockResolvedValue({
      data: [{ id: "inv-1" }],
      meta: { total: 1 },
    } as never);

    const { result } = renderHook(
      () => useStaffInvitations("org-1", "branch-1"),
      { wrapper: wrapperFor(makeClient()) },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetchStaffInvitations).toHaveBeenCalledWith({
      organizationId: "org-1",
      branchId: "branch-1",
      limit: 100,
      page: 1,
    });
    expect(result.current.data?.data).toEqual([{ id: "inv-1" }]);
    expect(result.current.data?.meta).toEqual({ total: 1 });
  });

  it("unwraps a bare-array response (no meta)", async () => {
    vi.mocked(fetchStaffInvitations).mockResolvedValue([
      { id: "inv-2" },
    ] as never);

    const { result } = renderHook(
      () => useStaffInvitations("org-1", "branch-1"),
      { wrapper: wrapperFor(makeClient()) },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data).toEqual([{ id: "inv-2" }]);
    expect(result.current.data?.meta).toBeUndefined();
  });

  it("stays disabled without org/branch", () => {
    const { result } = renderHook(
      () => useStaffInvitations(undefined, "branch-1"),
      { wrapper: wrapperFor(makeClient()) },
    );

    expect(result.current.fetchStatus).toBe("idle");
    expect(fetchStaffInvitations).not.toHaveBeenCalled();
  });
});

describe("useStaffInvitation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("unwraps a wrapped single invitation", async () => {
    vi.mocked(fetchStaffInvitation).mockResolvedValue({
      data: { id: "inv-1" },
    } as never);

    const { result } = renderHook(
      () => useStaffInvitation("org-1", "branch-1", "inv-1"),
      { wrapper: wrapperFor(makeClient()) },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ id: "inv-1" });
  });

  it("returns a bare single invitation untouched", async () => {
    vi.mocked(fetchStaffInvitation).mockResolvedValue({
      id: "inv-9",
    } as never);

    const { result } = renderHook(
      () => useStaffInvitation("org-1", "branch-1", "inv-9"),
      { wrapper: wrapperFor(makeClient()) },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ id: "inv-9" });
  });

  it("stays disabled without an invitation id", () => {
    const { result } = renderHook(
      () => useStaffInvitation("org-1", "branch-1", null),
      { wrapper: wrapperFor(makeClient()) },
    );

    expect(result.current.fetchStatus).toBe("idle");
    expect(fetchStaffInvitation).not.toHaveBeenCalled();
  });
});

describe("useResendStaffInvitation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("resends and invalidates invitation queries", async () => {
    vi.mocked(resendStaffInvitation).mockResolvedValue(undefined as never);
    const queryClient = makeClient();
    const invalidate = vi
      .spyOn(queryClient, "invalidateQueries")
      .mockResolvedValue();

    const { result } = renderHook(() => useResendStaffInvitation(), {
      wrapper: wrapperFor(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        organizationId: "org-1",
        branchId: "branch-1",
        invitationId: "inv-1",
      });
    });

    expect(resendStaffInvitation).toHaveBeenCalledWith("org-1", "branch-1", "inv-1");
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: staffQueryKeys.invitations.all(),
    });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: staffQueryKeys.invitations.detail("org-1", "branch-1", "inv-1"),
    });
  });

  it("toasts on failure", async () => {
    vi.mocked(resendStaffInvitation).mockRejectedValue(new Error("fail"));

    const { result } = renderHook(() => useResendStaffInvitation(), {
      wrapper: wrapperFor(makeClient()),
    });

    await act(async () => {
      await result.current
        .mutateAsync({
          organizationId: "org-1",
          branchId: "branch-1",
          invitationId: "inv-1",
        })
        .catch(() => {});
    });

    expect(toast.error).toHaveBeenCalledTimes(1);
  });
});

describe("useDeleteStaffInvitation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes and invalidates the invitation list", async () => {
    vi.mocked(deleteStaffInvitation).mockResolvedValue(undefined as never);
    const queryClient = makeClient();
    const invalidate = vi
      .spyOn(queryClient, "invalidateQueries")
      .mockResolvedValue();

    const { result } = renderHook(() => useDeleteStaffInvitation(), {
      wrapper: wrapperFor(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        organizationId: "org-1",
        branchId: "branch-1",
        invitationId: "inv-1",
      });
    });

    expect(deleteStaffInvitation).toHaveBeenCalledWith("org-1", "branch-1", "inv-1");
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: staffQueryKeys.invitations.all(),
    });
  });

  it("toasts on failure", async () => {
    vi.mocked(deleteStaffInvitation).mockRejectedValue(new Error("fail"));

    const { result } = renderHook(() => useDeleteStaffInvitation(), {
      wrapper: wrapperFor(makeClient()),
    });

    await act(async () => {
      await result.current
        .mutateAsync({
          organizationId: "org-1",
          branchId: "branch-1",
          invitationId: "inv-1",
        })
        .catch(() => {});
    });

    expect(toast.error).toHaveBeenCalledTimes(1);
  });
});
