import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render";
import type { StaffMember } from "../types/staff.types";
import { StaffOverview } from "./StaffOverview";

const member: StaffMember = {
  id: "staff-1",
  roleId: "role-1",
  firstName: "Mona",
  lastName: "Amin",
  email: "mona@example.com",
  handle: "@mona",
  role: "doctor",
  jobTitle: "Doctor",
  specialty: "Cardiology",
  phone: "+201000000000",
  status: "available",
  workSchedule: "Mon: 9:00AM - 5:00PM",
};

describe("StaffOverview", () => {
  it("does not render management actions without a selected member", () => {
    renderWithIntl(<StaffOverview member={null} />);

    expect(screen.queryByLabelText("Edit staff")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Deactivate staff")).not.toBeInTheDocument();
  });

  it("renders management actions for the selected member", () => {
    renderWithIntl(<StaffOverview member={member} />);

    expect(screen.getByLabelText("Edit staff")).toBeInTheDocument();
    expect(screen.getByLabelText("Deactivate staff")).toBeInTheDocument();
  });

  it("calls action handlers with the selected member", () => {
    const onEdit = vi.fn();
    const onDeactivate = vi.fn();

    renderWithIntl(
      <StaffOverview
        member={member}
        onDeactivate={onDeactivate}
        onEdit={onEdit}
      />,
    );

    fireEvent.click(screen.getByLabelText("Edit staff"));
    fireEvent.click(screen.getByLabelText("Deactivate staff"));

    expect(onEdit).toHaveBeenCalledWith(member);
    expect(onDeactivate).toHaveBeenCalledWith(member);
  });
});
