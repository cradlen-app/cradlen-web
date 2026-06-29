import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { ApiError } from "@/infrastructure/http/api";
import { inviteStaff } from "../lib/staff.api";
import { staffQueryKeys } from "../queryKeys";
import { useInviteStaff } from "./useInviteStaff";

vi.mock("../lib/staff.api", () => ({
  inviteStaff: vi.fn(),
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

const inviteArgs = {
  organizationId: "org-1",
  branchId: "branch-1",
  data: { email: "new@clinic.com", role_id: "r-1" } as never,
};

describe("useInviteStaff", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("invites staff and invalidates the org staff list", async () => {
    vi.mocked(inviteStaff).mockResolvedValue({} as never);

    const queryClient = makeClient();
    const invalidate = vi
      .spyOn(queryClient, "invalidateQueries")
      .mockResolvedValue();

    const { result } = renderHook(() => useInviteStaff(), {
      wrapper: wrapperFor(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync(inviteArgs);
    });

    expect(inviteStaff).toHaveBeenCalledWith(
      "org-1",
      "branch-1",
      inviteArgs.data,
    );
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: staffQueryKeys.byOrg("org-1"),
    });
  });

  it("toasts the first ApiError message on failure", async () => {
    vi.mocked(inviteStaff).mockRejectedValue(
      new ApiError(409, ["Email already invited"]),
    );

    const { result } = renderHook(() => useInviteStaff(), {
      wrapper: wrapperFor(makeClient()),
    });

    await act(async () => {
      await result.current.mutateAsync(inviteArgs).catch(() => {});
    });

    expect(toast.error).toHaveBeenCalledWith("Email already invited");
  });

  it("toasts a fallback message for non-ApiError failures", async () => {
    vi.mocked(inviteStaff).mockRejectedValue(new Error("network"));

    const { result } = renderHook(() => useInviteStaff(), {
      wrapper: wrapperFor(makeClient()),
    });

    await act(async () => {
      await result.current.mutateAsync(inviteArgs).catch(() => {});
    });

    expect(toast.error).toHaveBeenCalledWith("Failed to send invitation");
  });
});
