import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchAllStaff } from "../lib/staff.api";
import { useStaff, useStaffMember } from "./useStaff";

vi.mock("next-intl", () => ({
  useLocale: () => "en",
}));

vi.mock("../lib/staff.api", () => ({
  fetchAllStaff: vi.fn(),
}));

function makeMember(id: string, first: string) {
  return {
    staff_id: id,
    first_name: first,
    last_name: "Doe",
    email: `${first.toLowerCase()}@clinic.test`,
    subspecialties: [],
    branches: [],
  };
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("useStaff", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches and maps staff members for the active org/branch", async () => {
    vi.mocked(fetchAllStaff).mockResolvedValue([
      makeMember("s1", "Mona"),
      makeMember("s2", "Sara"),
    ] as never);

    const { result } = renderHook(
      () => useStaff("org-1", "branch-1", { search: "mo", role: "doctor" }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetchAllStaff).toHaveBeenCalledWith("org-1", "branch-1", {
      search: "mo",
      role: "doctor",
      status: undefined,
    });
    expect(result.current.data?.map((m) => m.id)).toEqual(["s1", "s2"]);
    expect(result.current.data?.[0].firstName).toBe("Mona");
  });

  it("stays disabled when org or branch is missing", () => {
    const { result } = renderHook(() => useStaff(undefined, "branch-1"), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe("idle");
    expect(fetchAllStaff).not.toHaveBeenCalled();
  });

  it("surfaces query errors", async () => {
    vi.mocked(fetchAllStaff).mockRejectedValue(new Error("boom"));

    const { result } = renderHook(() => useStaff("org-1", "branch-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
  });
});

describe("useStaffMember", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("derives the matching member from the cached list", async () => {
    vi.mocked(fetchAllStaff).mockResolvedValue([
      makeMember("s1", "Mona"),
      makeMember("s2", "Sara"),
    ] as never);

    const { result } = renderHook(
      () => useStaffMember("org-1", "branch-1", "s2"),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data?.id).toBe("s2");
    expect(result.current.data?.firstName).toBe("Sara");
  });

  it("returns undefined when no staffId is provided", async () => {
    vi.mocked(fetchAllStaff).mockResolvedValue([
      makeMember("s1", "Mona"),
    ] as never);

    const { result } = renderHook(
      () => useStaffMember("org-1", "branch-1", null),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeUndefined();
  });
});
