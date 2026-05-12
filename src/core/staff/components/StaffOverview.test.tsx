import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { STAFF_API_ROLE } from "@/features/auth/lib/auth.constants";
import { renderWithIntl } from "@/test/render";
import type { StaffMember } from "../types/staff.types";
import { StaffOverview } from "./StaffOverview";

const member: StaffMember = {
  id: "staff-1",
  firstName: "Mona",
  lastName: "Amin",
  email: "mona@example.com",
  handle: "@mona",
  role: STAFF_API_ROLE.STAFF,
  roles: [{ id: "role-1", name: "STAFF", role: STAFF_API_ROLE.STAFF }],
  branches: [],
  jobFunctions: [{ id: "j1", code: "OBGYN", name: "OB-GYN", is_clinical: true }],
  specialties: [{ id: "s1", code: "CARD", name: "Cardiology" }],
  executiveTitle: null,
  engagementType: "FULL_TIME",
  phone: "+201000000000",
  status: "available",
  workSchedule: "Mon: 9:00AM - 5:00PM",
  isClinical: true,
};

describe("StaffOverview", () => {
  it("does not render management actions without a selected member", () => {
    renderWithIntl(<StaffOverview member={null} />);

    expect(screen.queryByLabelText("Edit staff")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Delete from organization")).not.toBeInTheDocument();
  });

  it("renders edit + delete for an OWNER managing another staff", () => {
    renderWithIntl(
      <StaffOverview member={member} canManage canDelete currentUserStaffId="other" />,
    );

    expect(screen.getByLabelText("Edit staff")).toBeInTheDocument();
    expect(screen.getByLabelText("Delete from organization")).toBeInTheDocument();
  });

  it("hides delete on the user's own row even for OWNER", () => {
    renderWithIntl(
      <StaffOverview member={member} canManage canDelete currentUserStaffId="staff-1" />,
    );

    expect(screen.getByLabelText("Edit staff")).toBeInTheDocument();
    expect(screen.queryByLabelText("Delete from organization")).not.toBeInTheDocument();
  });

  it("calls action handlers with the selected member", () => {
    const onEdit = vi.fn();
    const onDeactivate = vi.fn();

    renderWithIntl(
      <StaffOverview
        member={member}
        canManage
        canDelete
        currentUserStaffId="other"
        onDeactivate={onDeactivate}
        onEdit={onEdit}
      />,
    );

    fireEvent.click(screen.getByLabelText("Edit staff"));
    fireEvent.click(screen.getByLabelText("Delete from organization"));

    expect(onEdit).toHaveBeenCalledWith(member);
    expect(onDeactivate).toHaveBeenCalledWith(member);
  });
});
