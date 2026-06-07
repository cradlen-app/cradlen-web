import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { removeStaffFromBranch, updateStaff } from "../lib/staff.api";
import { useRemoveStaffFromBranch, useUpdateStaff } from "./useManageStaff";

vi.mock("../lib/staff.api", () => ({
  removeStaffFromBranch: vi.fn(),
  updateStaff: vi.fn(),
}));

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("staff management hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(updateStaff).mockResolvedValue({} as never);
    vi.mocked(removeStaffFromBranch).mockResolvedValue(undefined);
  });

  it("updates staff (branch-scoped) and invalidates staff queries", async () => {
    const queryClient = new QueryClient();
    const invalidateQueries = vi
      .spyOn(queryClient, "invalidateQueries")
      .mockResolvedValue();
    const { result } = renderHook(() => useUpdateStaff(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        organizationId: "org-1",
        branchId: "branch-1",
        staffId: "staff-1",
        data: {
          first_name: "Mona",
          last_name: "Amin",
        },
      });
    });

    expect(updateStaff).toHaveBeenCalledWith(
      "org-1",
      "branch-1",
      "staff-1",
      expect.any(Object),
    );
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["staff", "org-1"] });
  });

  it("removes staff from a branch and invalidates staff queries", async () => {
    const queryClient = new QueryClient();
    const invalidateQueries = vi
      .spyOn(queryClient, "invalidateQueries")
      .mockResolvedValue();
    const { result } = renderHook(() => useRemoveStaffFromBranch(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        organizationId: "org-1",
        branchId: "branch-1",
        staffId: "staff-1",
      });
    });

    expect(removeStaffFromBranch).toHaveBeenCalledWith("org-1", "branch-1", "staff-1");
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["staff", "org-1"] });
  });
});
