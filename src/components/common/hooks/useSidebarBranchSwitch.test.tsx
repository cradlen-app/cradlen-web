import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { UserProfile } from "@/common/types/user.types";

const activeProfile = {
  profile_id: "p-1",
  organization: { id: "org-1", name: "Org One" },
  branches: [
    { branch_id: "b-1", is_main: true },
    { branch_id: "b-2" },
  ],
} as unknown as UserProfile;

const otherProfile = {
  profile_id: "p-2",
  organization: { id: "org-2", name: "Org Two" },
  branches: [{ branch_id: "b-9", is_main: true }],
} as unknown as UserProfile;

const hoisted = vi.hoisted(() => ({
  replace: vi.fn(),
  pathname: "/org-1/b-1/dashboard/patients",
  switchBranchMutate: vi.fn(),
  selectProfileMutate: vi.fn(),
  queryClientClear: vi.fn(),
  toastError: vi.fn(),
  ctx: { organizationId: "org-1", branchId: "b-1", profileId: "p-1" } as {
    organizationId: string | null;
    branchId: string | null;
    profileId: string | null;
  },
  setContext: vi.fn(),
  availableProfiles: [] as unknown[],
}));

hoisted.setContext.mockImplementation(
  (c: { organizationId: string; branchId?: string | null; profileId: string }) => {
    hoisted.ctx.organizationId = c.organizationId;
    hoisted.ctx.branchId = c.branchId ?? null;
    hoisted.ctx.profileId = c.profileId;
  },
);

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/i18n/navigation", () => ({
  usePathname: () => hoisted.pathname,
  useRouter: () => ({ replace: hoisted.replace }),
}));

vi.mock("sonner", () => ({
  toast: { error: hoisted.toastError, success: vi.fn() },
}));

vi.mock("@/infrastructure/query/queryClient", () => ({
  queryClient: { clear: () => hoisted.queryClientClear() },
}));

vi.mock("@/features/auth/hooks/useSwitchBranch", () => ({
  useSwitchBranch: () => ({
    mutateAsync: hoisted.switchBranchMutate,
    isPending: false,
  }),
}));

vi.mock("@/features/auth/hooks/useSelectProfile", () => ({
  useSelectProfile: () => ({
    mutateAsync: hoisted.selectProfileMutate,
    isPending: false,
  }),
}));

vi.mock("@/features/auth/store/authContextStore", () => ({
  useAuthContextStore: (
    selector: (s: {
      branchId: string | null;
      profileId: string | null;
      setContext: typeof hoisted.setContext;
    }) => unknown,
  ) =>
    selector({
      branchId: hoisted.ctx.branchId,
      profileId: hoisted.ctx.profileId,
      setContext: hoisted.setContext,
    }),
}));

vi.mock("@/features/auth/store/availableProfilesStore", () => ({
  useAvailableProfilesStore: (
    selector: (s: { profiles: unknown[]; expiresAt: number }) => unknown,
  ) => selector({ profiles: hoisted.availableProfiles, expiresAt: Date.now() + 1e6 }),
  getValidAvailableProfiles: (s: { profiles: unknown[] }) => s.profiles,
}));

import { useSidebarBranchSwitch } from "./useSidebarBranchSwitch";

describe("useSidebarBranchSwitch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hoisted.ctx = { organizationId: "org-1", branchId: "b-1", profileId: "p-1" };
    hoisted.availableProfiles = [otherProfile];
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("derives branch, profile groups and option flags", () => {
    const { result } = renderHook(() => useSidebarBranchSwitch(activeProfile));

    expect(result.current.activeProfileId).toBe("p-1");
    expect(result.current.branches).toHaveLength(2);
    expect(result.current.hasMultipleBranches).toBe(true);
    expect(result.current.branch?.branch_id).toBe("b-1");
    expect(result.current.groups.map((g) => g.profileId)).toEqual(["p-1", "p-2"]);
    expect(result.current.hasMultipleProfiles).toBe(true);
    expect(result.current.hasMultipleOptions).toBe(true);
    expect(result.current.isSwitching).toBe(false);
  });

  it("no-ops when selecting the already-active profile and branch", async () => {
    const { result } = renderHook(() => useSidebarBranchSwitch(activeProfile));

    act(() => result.current.setBranchMenuOpen(true));
    await act(async () => {
      await result.current.handleSelect("p-1", "b-1");
    });

    expect(hoisted.switchBranchMutate).not.toHaveBeenCalled();
    expect(hoisted.selectProfileMutate).not.toHaveBeenCalled();
    expect(result.current.branchMenuOpen).toBe(false);
  });

  it("switches branch within the active profile and updates context + route", async () => {
    hoisted.switchBranchMutate.mockResolvedValue({ data: { branch_id: "b-2" } });
    const { result } = renderHook(() => useSidebarBranchSwitch(activeProfile));

    await act(async () => {
      await result.current.handleSelect("p-1", "b-2");
    });

    expect(hoisted.switchBranchMutate).toHaveBeenCalledWith({ branch_id: "b-2" });
    expect(hoisted.setContext).toHaveBeenCalledWith({
      organizationId: "org-1",
      branchId: "b-2",
      profileId: "p-1",
    });
    expect(hoisted.queryClientClear).toHaveBeenCalled();
    expect(hoisted.replace).toHaveBeenCalledWith("/org-1/b-2/dashboard/patients");
  });

  it("toasts and resets switching state when the branch switch fails", async () => {
    hoisted.switchBranchMutate.mockRejectedValue(new Error("nope"));
    const { result } = renderHook(() => useSidebarBranchSwitch(activeProfile));

    await act(async () => {
      await result.current.handleBranchSwitch("b-2");
    });

    expect(hoisted.toastError).toHaveBeenCalledWith("switchBranchError");
    expect(hoisted.replace).not.toHaveBeenCalled();
    await waitFor(() => expect(result.current.switchingToBranchId).toBeNull());
  });

  it("switches to a different profile and applies the response context", async () => {
    hoisted.selectProfileMutate.mockResolvedValue({
      data: {
        organization_id: "org-2",
        branch_id: "b-9",
        profile_id: "p-2",
      },
    });
    const { result } = renderHook(() => useSidebarBranchSwitch(activeProfile));

    await act(async () => {
      await result.current.handleSelect("p-2", "b-9");
    });

    // single-branch target → no branch_id in the select payload
    expect(hoisted.selectProfileMutate).toHaveBeenCalledWith({
      profile_id: "p-2",
      organization_id: "org-2",
    });
    expect(hoisted.setContext).toHaveBeenCalledWith({
      organizationId: "org-2",
      branchId: "b-9",
      profileId: "p-2",
    });
    expect(hoisted.queryClientClear).toHaveBeenCalled();
    expect(hoisted.replace).toHaveBeenCalledWith("/org-2/b-9/dashboard/patients");
  });

  it("returns no extra options for a single-branch, single-profile user", () => {
    hoisted.availableProfiles = [];
    const soloProfile = {
      profile_id: "p-1",
      organization: { id: "org-1", name: "Org One" },
      branches: [{ branch_id: "b-1", is_main: true }],
    } as unknown as UserProfile;

    const { result } = renderHook(() => useSidebarBranchSwitch(soloProfile));

    expect(result.current.hasMultipleBranches).toBe(false);
    expect(result.current.hasMultipleProfiles).toBe(false);
    expect(result.current.hasMultipleOptions).toBe(false);
  });
});
