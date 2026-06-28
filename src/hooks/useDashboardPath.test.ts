import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";

const useParamsMock = vi.fn();

vi.mock("next/navigation", () => ({
  useParams: () => useParamsMock(),
}));

import { useDashboardPath } from "./useDashboardPath";

describe("useDashboardPath", () => {
  it("builds the dashboard base url from route params", () => {
    useParamsMock.mockReturnValue({ orgId: "org-1", branchId: "branch-1" });
    const { result } = renderHook(() => useDashboardPath());
    expect(result.current()).toBe("/org-1/branch-1/dashboard");
  });

  it("appends a sub-path segment", () => {
    useParamsMock.mockReturnValue({ orgId: "org-1", branchId: "branch-1" });
    const { result } = renderHook(() => useDashboardPath());
    expect(result.current("/patients")).toBe(
      "/org-1/branch-1/dashboard/patients",
    );
  });
});
