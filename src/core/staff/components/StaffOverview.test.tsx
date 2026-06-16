import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { STAFF_API_ROLE } from "@/features/auth/lib/auth.constants";
import { renderWithIntl } from "@/test/render";
import type { StaffMember } from "../types/staff.types";
import { StaffOverview } from "./StaffOverview";

const BRANCH = "branch-1";

const member: StaffMember = {
  id: "staff-1",
  firstName: "Mona",
  lastName: "Amin",
  email: "mona@example.com",
  handle: "@mona",
  role: STAFF_API_ROLE.STAFF,
  roleId: "role-1",
  roleName: "STAFF",
  branches: [{ id: BRANCH, name: "Main Branch", city: "Cairo", governorate: "Cairo" }],
  jobFunction: { id: "j1", code: "OBGYN", name: "OB-GYN", is_clinical: true },
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
    expect(screen.queryByLabelText("Remove from this branch")).not.toBeInTheDocument();
  });

  it("renders edit + remove for a manager handling another staff in the branch", () => {
    renderWithIntl(
      <StaffOverview
        member={member}
        canManage
        currentBranchId={BRANCH}
        currentUserStaffId="other"
        onRemoveFromBranch={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Edit staff")).toBeInTheDocument();
    expect(screen.getByLabelText("Remove from this branch")).toBeInTheDocument();
  });

  it("hides remove on the user's own row", () => {
    renderWithIntl(
      <StaffOverview
        member={member}
        canManage
        currentBranchId={BRANCH}
        currentUserStaffId="staff-1"
        onRemoveFromBranch={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Edit staff")).toBeInTheDocument();
    expect(screen.queryByLabelText("Remove from this branch")).not.toBeInTheDocument();
  });

  it("calls action handlers with the selected member", () => {
    const onEdit = vi.fn();
    const onRemoveFromBranch = vi.fn();

    renderWithIntl(
      <StaffOverview
        member={member}
        canManage
        currentBranchId={BRANCH}
        currentUserStaffId="other"
        onRemoveFromBranch={onRemoveFromBranch}
        onEdit={onEdit}
      />,
    );

    fireEvent.click(screen.getByLabelText("Edit staff"));
    fireEvent.click(screen.getByLabelText("Remove from this branch"));

    expect(onEdit).toHaveBeenCalledWith(member);
    expect(onRemoveFromBranch).toHaveBeenCalledWith(member);
  });
});
