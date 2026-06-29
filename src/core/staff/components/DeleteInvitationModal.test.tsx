import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/render";
import type { ApiStaffInvitation } from "../types/staff.api.types";
import DeleteInvitationModal from "./DeleteInvitationModal";

const invitation: ApiStaffInvitation = {
  id: "inv-1",
  email: "amir@example.com",
};

describe("DeleteInvitationModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("stays closed when no invitation is provided", () => {
    renderWithIntl(
      <DeleteInvitationModal
        invitation={null}
        isDeleting={false}
        onConfirm={vi.fn()}
        onOpenChange={vi.fn()}
      />,
    );
    expect(screen.queryByText("Delete invitation?")).not.toBeInTheDocument();
  });

  it("renders the title and the email in the description", () => {
    renderWithIntl(
      <DeleteInvitationModal
        invitation={invitation}
        isDeleting={false}
        onConfirm={vi.fn()}
        onOpenChange={vi.fn()}
      />,
    );
    expect(screen.getByText("Delete invitation?")).toBeInTheDocument();
    expect(
      screen.getByText("This will remove the invitation for amir@example.com."),
    ).toBeInTheDocument();
  });

  it("invokes onConfirm when the destructive action is clicked", () => {
    const onConfirm = vi.fn();
    renderWithIntl(
      <DeleteInvitationModal
        invitation={invitation}
        isDeleting={false}
        onConfirm={onConfirm}
        onOpenChange={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("shows a deleting label and disables the action while in flight", () => {
    renderWithIntl(
      <DeleteInvitationModal
        invitation={invitation}
        isDeleting
        onConfirm={vi.fn()}
        onOpenChange={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "Deleting..." })).toBeDisabled();
  });
});
