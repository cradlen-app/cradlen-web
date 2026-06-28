import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { StaffMember } from "../types/staff.types";
import { useStaffDirectory } from "./useStaffDirectory";

function member(partial: Partial<StaffMember> & { id: string }): StaffMember {
  return {
    id: partial.id,
    firstName: partial.firstName ?? "First",
    lastName: partial.lastName ?? "Last",
    email: "x@y.test",
    handle: partial.handle ?? `@${partial.id}`,
    phone: partial.phone ?? "-",
    status: "available",
    role: partial.role ?? "STAFF",
    roleId: "",
    roleName: "",
    branches: [],
    jobFunction: null,
    specialty: null,
    subspecialties: [],
    executiveTitle: null,
    professionalTitle: null,
    engagementType: null,
    schedule: undefined,
    workSchedule: undefined,
    isClinical: false,
    imageUrl: null,
  } as StaffMember;
}

const staff = [
  member({ id: "a", firstName: "Mona", role: "OWNER" }),
  member({ id: "b", firstName: "Sara", role: "STAFF" }),
  member({ id: "c", firstName: "Omar", role: "OWNER" }),
];

describe("useStaffDirectory", () => {
  it("returns all staff and selects the first by default", () => {
    const { result } = renderHook(() =>
      useStaffDirectory({ filter: "all", search: "", staff }),
    );

    expect(result.current.filteredStaff).toHaveLength(3);
    expect(result.current.totalStaff).toBe(3);
    expect(result.current.selectedId).toBe("a");
    expect(result.current.selectedMember?.id).toBe("a");
  });

  it("filters by role", () => {
    const { result } = renderHook(() =>
      useStaffDirectory({ filter: "STAFF", search: "", staff }),
    );

    expect(result.current.filteredStaff.map((m) => m.id)).toEqual(["b"]);
    expect(result.current.selectedId).toBe("b");
  });

  it("filters by search term", () => {
    const { result } = renderHook(() =>
      useStaffDirectory({ filter: "all", search: "omar", staff }),
    );

    expect(result.current.filteredStaff.map((m) => m.id)).toEqual(["c"]);
  });

  it("lets the caller change selection", () => {
    const { result } = renderHook(() =>
      useStaffDirectory({ filter: "all", search: "", staff }),
    );

    act(() => result.current.setSelectedId("c"));
    expect(result.current.selectedId).toBe("c");
    expect(result.current.selectedMember?.id).toBe("c");
  });

  it("falls back to the first visible member when the selection is filtered out", () => {
    const { result, rerender } = renderHook(
      ({ search }: { search: string }) =>
        useStaffDirectory({ filter: "all", search, staff }),
      { initialProps: { search: "" } },
    );

    act(() => result.current.setSelectedId("c"));
    expect(result.current.selectedId).toBe("c");

    rerender({ search: "mona" });
    // "c" no longer visible → falls back to first filtered ("a")
    expect(result.current.selectedId).toBe("a");
    expect(result.current.selectedMember?.id).toBe("a");
  });

  it("returns null selection for an empty roster", () => {
    const { result } = renderHook(() =>
      useStaffDirectory({ filter: "all", search: "", staff: [] }),
    );

    expect(result.current.selectedId).toBeNull();
    expect(result.current.selectedMember).toBeNull();
    expect(result.current.totalStaff).toBe(0);
  });
});
