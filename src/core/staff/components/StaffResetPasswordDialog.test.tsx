import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/render";
import type { StaffMember } from "../types/staff.types";

const { mutateAsyncMock, toastSuccessMock } = vi.hoisted(() => ({
  mutateAsyncMock: vi.fn(),
  toastSuccessMock: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { success: toastSuccessMock, error: vi.fn() },
}));
vi.mock("../hooks/useManageStaff", () => ({
  useResetStaffPassword: () => ({
    mutateAsync: mutateAsyncMock,
    isPending: false,
  }),
}));

import { StaffResetPasswordDialog } from "./StaffResetPasswordDialog";

function member(): StaffMember {
  return {
    id: "s-1",
    firstName: "Amir",
    lastName: "Hassan",
    email: "amir@example.com",
    handle: "@amir",
    phone: "+20100",
    status: "available",
    role: "STAFF",
    roleId: "r-1",
    roleName: "STAFF",
    subspecialties: [],
  } as unknown as StaffMember;
}

describe("StaffResetPasswordDialog", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders nothing when no member is provided", () => {
    const { container } = renderWithIntl(
      <StaffResetPasswordDialog
        member={null}
        open
        onOpenChange={vi.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows a validation error for a short password", async () => {
    renderWithIntl(
      <StaffResetPasswordDialog
        member={member()}
        organizationId="org-1"
        branchId="branch-1"
        open
        onOpenChange={vi.fn()}
      />,
    );
    await userEvent.type(screen.getByDisplayValue(""), "short");
    await userEvent.click(screen.getByRole("button", { name: "Reset password" }));
    expect(
      await screen.findByText("Password must be at least 8 characters."),
    ).toBeInTheDocument();
    expect(mutateAsyncMock).not.toHaveBeenCalled();
  });

  it("submits a valid password and closes on success", async () => {
    mutateAsyncMock.mockResolvedValue(undefined);
    const onOpenChange = vi.fn();
    renderWithIntl(
      <StaffResetPasswordDialog
        member={member()}
        organizationId="org-1"
        branchId="branch-1"
        open
        onOpenChange={onOpenChange}
      />,
    );
    const input = document.querySelector(
      'input[type="password"]',
    ) as HTMLInputElement;
    await userEvent.type(input, "supersecret");
    await userEvent.click(screen.getByRole("button", { name: "Reset password" }));

    await waitFor(() =>
      expect(mutateAsyncMock).toHaveBeenCalledWith({
        organizationId: "org-1",
        branchId: "branch-1",
        staffId: "s-1",
        password: "supersecret",
      }),
    );
    expect(toastSuccessMock).toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("does not call the mutation when org/branch are missing", async () => {
    renderWithIntl(
      <StaffResetPasswordDialog
        member={member()}
        open
        onOpenChange={vi.fn()}
      />,
    );
    const input = document.querySelector(
      'input[type="password"]',
    ) as HTMLInputElement;
    await userEvent.type(input, "supersecret");
    await userEvent.click(screen.getByRole("button", { name: "Reset password" }));
    // Validation passes, but the submit guard short-circuits without ids.
    await waitFor(() => expect(mutateAsyncMock).not.toHaveBeenCalled());
  });

  it("toggles password visibility", async () => {
    renderWithIntl(
      <StaffResetPasswordDialog
        member={member()}
        organizationId="org-1"
        branchId="branch-1"
        open
        onOpenChange={vi.fn()}
      />,
    );
    const input = document.querySelector(
      'input[name="password"]',
    ) as HTMLInputElement;
    expect(input.type).toBe("password");
    await userEvent.click(screen.getByRole("button", { name: "Show" }));
    expect(input.type).toBe("text");
    await userEvent.click(screen.getByRole("button", { name: "Hide" }));
    expect(input.type).toBe("password");
  });
});
