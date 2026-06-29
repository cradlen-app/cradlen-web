import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/render";
import type { StaffMember } from "../types/staff.types";
import { StaffTable } from "./StaffTable";

function member(overrides: Partial<StaffMember> = {}): StaffMember {
  return {
    id: "s-1",
    firstName: "Amir",
    lastName: "Hassan",
    handle: "@amir",
    phone: "+201000000000",
    status: "available",
    role: "OWNER",
    roleId: "r-1",
    roleName: "OWNER",
    subspecialties: [],
    ...overrides,
  } as unknown as StaffMember;
}

describe("StaffTable", () => {
  it("renders an empty state when there are no members", () => {
    renderWithIntl(
      <StaffTable members={[]} selectedId={null} onSelect={vi.fn()} />,
    );
    expect(
      screen.getByText("No staff members match your filters."),
    ).toBeInTheDocument();
  });

  it("renders rows with name, role, specialty and job function labels", () => {
    renderWithIntl(
      <StaffTable
        members={[
          member({
            executiveTitle: "CEO" as never,
            specialty: { id: "sp-1", name: "Obstetrics" } as never,
            jobFunction: { id: "jf-1", name: "Doctor" } as never,
          }),
        ]}
        selectedId={null}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getByText("Amir Hassan")).toBeInTheDocument();
    expect(screen.getByText("Owner")).toBeInTheDocument();
    expect(screen.getByText("Obstetrics")).toBeInTheDocument();
    expect(screen.getByText("Doctor")).toBeInTheDocument();
    expect(screen.getByText("CEO")).toBeInTheDocument();
  });

  it("falls back to a dash when no specialty is set", () => {
    renderWithIntl(
      <StaffTable
        members={[member({ id: "s-2" })]}
        selectedId={null}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getByText("-")).toBeInTheDocument();
  });

  it("calls onSelect and marks the selected row", async () => {
    const onSelect = vi.fn();
    renderWithIntl(
      <StaffTable
        members={[member({ id: "s-3" })]}
        selectedId="s-3"
        onSelect={onSelect}
      />,
    );
    const row = screen.getByRole("row", { selected: true });
    expect(row).toBeInTheDocument();
    await userEvent.click(screen.getByText("Amir Hassan"));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "s-3" }));
  });
});
