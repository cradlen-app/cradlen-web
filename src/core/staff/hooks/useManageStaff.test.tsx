import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { deactivateStaff, updateStaff } from "../lib/staff.api";
import { useDeactivateStaff, useUpdateStaff } from "./useManageStaff";

vi.mock("../lib/staff.api", () => ({
  deactivateStaff: vi.fn(),
  updateStaff: vi.fn(),
  unassignStaffFromBranch: vi.fn(),
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
    vi.mocked(deactivateStaff).mockResolvedValue(undefined);
  });

  it("updates staff and invalidates staff queries", async () => {
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
        staffId: "staff-1",
        data: {
          first_name: "Mona",
          last_name: "Amin",
        },
      });
    });

    expect(updateStaff).toHaveBeenCalledWith("org-1", "staff-1", expect.any(Object));
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["staff", "org-1"] });
  });

  it("deactivates staff and invalidates staff queries", async () => {
    const queryClient = new QueryClient();
    const invalidateQueries = vi
      .spyOn(queryClient, "invalidateQueries")
      .mockResolvedValue();
    const { result } = renderHook(() => useDeactivateStaff(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        organizationId: "org-1",
        staffId: "staff-1",
      });
    });

    expect(deactivateStaff).toHaveBeenCalledWith("org-1", "staff-1");
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["staff", "org-1"] });
  });
});
