import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/render";
import type { ApiStaffInvitation } from "../types/staff.api.types";
import InvitationsTable from "./InvitationsTable";

const baseInvitation: ApiStaffInvitation = {
  id: "inv-1",
  email: "amir@example.com",
  first_name: "Amir",
  last_name: "Hassan",
  status: "pending",
  invited_at: "2026-06-01T00:00:00Z",
  expires_at: "2026-07-01T00:00:00Z",
  role: { id: "r1", name: "STAFF" },
  job_function: { id: "j1", code: "DOCTOR", name: "Doctor", is_clinical: true },
};

function renderTable(overrides: Partial<Parameters<typeof InvitationsTable>[0]> = {}) {
  const props = {
    invitations: [baseInvitation],
    onDelete: vi.fn(),
    onResend: vi.fn(),
    onSelect: vi.fn(),
    resendingId: null,
    selectedId: null,
    ...overrides,
  };
  renderWithIntl(<InvitationsTable {...props} />);
  return props;
}

describe("InvitationsTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows an empty-state message when there are no invitations", () => {
    renderTable({ invitations: [] });
    expect(
      screen.getByText("No invitations match your filters."),
    ).toBeInTheDocument();
  });

  it("renders the invitee name, email, role and job-function labels", () => {
    renderTable();

    expect(screen.getByText("Amir Hassan")).toBeInTheDocument();
    expect(screen.getByText("amir@example.com")).toBeInTheDocument();
    // role.name "STAFF" -> localized "Staff"
    expect(screen.getByText("Staff")).toBeInTheDocument();
    // job_function code DOCTOR -> localized "Doctor"
    expect(screen.getByText("Doctor")).toBeInTheDocument();
  });

  it("falls back to the unnamed-invitee label when no name is present", () => {
    renderTable({
      invitations: [{ ...baseInvitation, first_name: undefined, last_name: undefined }],
    });
    expect(screen.getByText("Unnamed invitee")).toBeInTheDocument();
  });

  it("keeps an unknown backend role name verbatim instead of coercing it", () => {
    renderTable({
      invitations: [{ ...baseInvitation, role: { id: "rx", name: "CUSTOM_ROLE" } }],
    });
    expect(screen.getByText("CUSTOM_ROLE")).toBeInTheDocument();
  });

  it("shows a dash for the job function when there is none", () => {
    renderTable({ invitations: [{ ...baseInvitation, job_function: null }] });
    expect(screen.getByText("-")).toBeInTheDocument();
  });

  it("fires the row-action callbacks with the invitation", () => {
    const props = renderTable();

    fireEvent.click(screen.getByLabelText("View invitation"));
    expect(props.onSelect).toHaveBeenCalledWith(baseInvitation);

    fireEvent.click(screen.getByLabelText("Resend"));
    expect(props.onResend).toHaveBeenCalledWith(baseInvitation);

    fireEvent.click(screen.getByLabelText("Delete"));
    expect(props.onDelete).toHaveBeenCalledWith(baseInvitation);
  });

  it("disables the resend button for the invitation being resent", () => {
    renderTable({ resendingId: "inv-1" });
    expect(screen.getByLabelText("Resend")).toBeDisabled();
  });

  it("marks the selected row as aria-selected", () => {
    renderTable({ selectedId: "inv-1" });
    expect(screen.getByRole("row", { selected: true })).toBeInTheDocument();
  });
});
