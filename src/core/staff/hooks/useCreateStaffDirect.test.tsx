import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { ApiError } from "@/infrastructure/http/api";
import { createStaffDirect } from "../lib/staff.api";
import { staffQueryKeys } from "../queryKeys";
import { useCreateStaffDirect } from "./useCreateStaffDirect";

vi.mock("../lib/staff.api", () => ({
  createStaffDirect: vi.fn(),
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

const variables = {
  organizationId: "org-1",
  branchId: "branch-1",
  data: { first_name: "Mona" } as never,
};

describe("useCreateStaffDirect", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a staff member and invalidates the org staff cache", async () => {
    vi.mocked(createStaffDirect).mockResolvedValue({ id: "s1" } as never);
    const queryClient = makeClient();
    const invalidate = vi
      .spyOn(queryClient, "invalidateQueries")
      .mockResolvedValue();

    const { result } = renderHook(() => useCreateStaffDirect(), {
      wrapper: wrapperFor(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync(variables);
    });

    expect(createStaffDirect).toHaveBeenCalledWith(
      "org-1",
      "branch-1",
      variables.data,
    );
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: staffQueryKeys.byOrg("org-1"),
    });
  });

  it("toasts the first ApiError message on failure", async () => {
    vi.mocked(createStaffDirect).mockRejectedValue(
      new ApiError(422, ["Email already used", "secondary"]),
    );

    const { result } = renderHook(() => useCreateStaffDirect(), {
      wrapper: wrapperFor(makeClient()),
    });

    await act(async () => {
      await result.current.mutateAsync(variables).catch(() => {});
    });

    expect(toast.error).toHaveBeenCalledWith("Email already used");
  });

  it("toasts a generic message for non-ApiError failures", async () => {
    vi.mocked(createStaffDirect).mockRejectedValue(new Error("network"));

    const { result } = renderHook(() => useCreateStaffDirect(), {
      wrapper: wrapperFor(makeClient()),
    });

    await act(async () => {
      await result.current.mutateAsync(variables).catch(() => {});
    });

    expect(toast.error).toHaveBeenCalledWith("Failed to create staff member");
  });
});
