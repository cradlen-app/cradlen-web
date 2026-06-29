import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
} from "react-hook-form";

import { renderWithIntl } from "@/test/render";
import {
  ENGAGEMENT_TYPE,
  JOB_ROLE,
  STAFF_API_ROLE,
  type StaffApiRole,
} from "@/features/auth/lib/auth.constants";
import type { StaffRoleOption } from "../types/staff.types";
import type { StaffInviteFormValues } from "../lib/staff-invite.schemas";
import type { ApiStaffSpecialty } from "../types/staff.api.types";
import type { OrganizationBranch } from "@/features/settings/lib/settings.api";
import StaffFormFields, { type StaffFormFieldsProps } from "./StaffFormFields";

const ROLES: StaffRoleOption[] = [
  { id: "role-owner", name: "OWNER", role: STAFF_API_ROLE.OWNER },
  { id: "role-bm", name: "BRANCH_MANAGER", role: STAFF_API_ROLE.BRANCH_MANAGER },
  { id: "role-staff", name: "STAFF", role: STAFF_API_ROLE.STAFF },
  { id: "role-unknown", name: "MYSTERY", role: "UNKNOWN" },
];

const SPECIALTIES: ApiStaffSpecialty[] = [
  { id: "sp-1", code: "OBGYN", name: "OB-GYN", subspecialties: [] },
];

const BRANCHES = [
  { id: "b1", name: "Main", city: "Cairo" },
  { id: "b2", name: "North", city: "Giza" },
] as unknown as OrganizationBranch[];

// Stub the RHF plumbing — these fields only need to render and report writes.
const register = ((name: string) => ({ name })) as unknown as UseFormRegister<
  StaffInviteFormValues
>;

function renderFields(overrides: Partial<StaffFormFieldsProps> = {}) {
  const setValue = vi.fn() as unknown as UseFormSetValue<StaffInviteFormValues>;
  const props: StaffFormFieldsProps = {
    errors: {} as FieldErrors<StaffInviteFormValues>,
    isDirectMode: false,
    isEditMode: false,
    member: null,
    register: register as never,
    setValue: setValue as never,
    roles: ROLES,
    assignableRoles: new Set<StaffApiRole>([STAFF_API_ROLE.STAFF]),
    selectedRoleId: "",
    selectedJobRole: JOB_ROLE.NONE,
    selectedEngagementType: ENGAGEMENT_TYPE.FULL_TIME,
    selectedExecutiveTitle: null,
    specialtyOptions: SPECIALTIES,
    selectedDoctorSpecialty: "",
    selectedDoctorSubspecialties: [],
    branchOptions: BRANCHES,
    selectedBranchIds: [],
    assignableBranchIds: new Set<string>(),
    showPassword: false,
    hideRolePicker: false,
    onTogglePassword: vi.fn(),
    ...overrides,
  };
  renderWithIntl(<StaffFormFields {...props} />);
  return { setValue: props.setValue };
}

describe("StaffFormFields", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("offers only assignable roles and never the UNKNOWN role (non-owner)", () => {
    renderFields({ assignableRoles: new Set([STAFF_API_ROLE.STAFF]) });

    expect(screen.getByRole("button", { name: "Staff" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Owner" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Branch Manager" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Unknown" })).not.toBeInTheDocument();
  });

  it("offers owner, branch manager and staff when the caller may assign them all", () => {
    renderFields({
      assignableRoles: new Set([
        STAFF_API_ROLE.OWNER,
        STAFF_API_ROLE.BRANCH_MANAGER,
        STAFF_API_ROLE.STAFF,
      ]),
    });

    expect(screen.getByRole("button", { name: "Owner" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Branch Manager" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Staff" })).toBeInTheDocument();
  });

  it("writes the role id when a role chip is chosen", () => {
    const { setValue } = renderFields({
      assignableRoles: new Set([STAFF_API_ROLE.STAFF]),
    });
    fireEvent.click(screen.getByRole("button", { name: "Staff" }));
    expect(setValue).toHaveBeenCalledWith(
      "roleId",
      "role-staff",
      expect.objectContaining({ shouldValidate: true }),
    );
  });

  it("renders all four job-function options", () => {
    renderFields();
    expect(screen.getByRole("button", { name: "Doctor" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Receptionist" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Accountant" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "None / administration" }),
    ).toBeInTheDocument();
  });

  it("hides the doctor specialty picker for a non-doctor job role", () => {
    renderFields({ selectedJobRole: JOB_ROLE.NONE });
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("reveals the doctor specialty picker when the Doctor job role is active", () => {
    renderFields({ selectedJobRole: JOB_ROLE.DOCTOR });
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "OB-GYN" })).toBeInTheDocument();
  });

  it("shows the email field in invite mode", () => {
    renderFields({ isDirectMode: false });
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.queryByText("Password")).not.toBeInTheDocument();
  });

  it("shows the password field in direct mode", () => {
    renderFields({ isDirectMode: true });
    expect(screen.getByText("Password")).toBeInTheDocument();
  });

  it("renders a read-only email in edit mode", () => {
    renderFields({
      isEditMode: true,
      member: {
        id: "s1",
        firstName: "Mona",
        lastName: "Amin",
        email: "mona@example.com",
        handle: "@mona",
        phone: "-",
        status: "available",
        role: STAFF_API_ROLE.STAFF,
        roleId: "role-staff",
        roleName: "STAFF",
        branches: [],
        jobFunction: null,
        specialty: null,
        subspecialties: [],
        isClinical: false,
      },
    });
    const emailInput = screen.getByDisplayValue("mona@example.com");
    expect(emailInput).toHaveAttribute("readonly");
  });
});
