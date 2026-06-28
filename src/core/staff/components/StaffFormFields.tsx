"use client";

import type {
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
} from "react-hook-form";
import type {
  EngagementTypeCode,
  ExecutiveTitleCode,
  JobRoleCode,
  StaffApiRole,
} from "@/features/auth/lib/auth.constants";
import type {
  StaffCreateDirectFormValues,
  StaffInviteFormValues,
} from "../lib/staff-invite.schemas";
import type { ApiStaffSpecialty } from "../types/staff.api.types";
import type { StaffMember, StaffRoleOption } from "../types/staff.types";
import type { OrganizationBranch } from "@/features/settings/lib/settings.api";
import {
  AccountSection,
  BranchesSection,
  EngagementSection,
  JobFunctionSection,
  PersonalSection,
} from "./staff-form-sections";

type AnyFormValues = StaffInviteFormValues | StaffCreateDirectFormValues;

export type StaffFormFieldsProps = {
  errors: FieldErrors<AnyFormValues>;
  isDirectMode: boolean;
  isEditMode: boolean;
  member?: StaffMember | null;
  register: UseFormRegister<AnyFormValues>;
  setValue: UseFormSetValue<AnyFormValues>;
  roles: StaffRoleOption[];
  /** Roles assignable by the current user (OWNER can assign anything except OWNER itself). */
  assignableRoles: Set<StaffApiRole>;
  selectedRoleId: string;
  selectedJobRole: JobRoleCode;
  selectedEngagementType: EngagementTypeCode;
  selectedExecutiveTitle: ExecutiveTitleCode | null | undefined;
  specialtyOptions: ApiStaffSpecialty[];
  selectedDoctorSpecialty: string;
  selectedDoctorSubspecialties: string[];
  branchOptions: OrganizationBranch[];
  selectedBranchIds: string[];
  /** Branches the current user is allowed to assign (BRANCH_MANAGER scope). Empty = no scope restriction. */
  assignableBranchIds: Set<string>;
  showPassword: boolean;
  /** Hide the role picker (e.g. BRANCH_MANAGER editing). */
  hideRolePicker?: boolean;
  onTogglePassword: () => void;
};

/**
 * Composes the staff invite/create/edit form from its field sections (see
 * ./staff-form-sections). All form state lives in the parent drawer; this just
 * threads the shared RHF wiring and the watched values into each section.
 */
export default function StaffFormFields({
  errors,
  isDirectMode,
  isEditMode,
  member,
  register,
  setValue,
  roles,
  assignableRoles,
  selectedRoleId,
  selectedJobRole,
  selectedEngagementType,
  selectedExecutiveTitle,
  specialtyOptions,
  selectedDoctorSpecialty,
  selectedDoctorSubspecialties,
  branchOptions,
  selectedBranchIds,
  assignableBranchIds,
  showPassword,
  hideRolePicker,
  onTogglePassword,
}: StaffFormFieldsProps) {
  return (
    <>
      <AccountSection
        register={register}
        errors={errors}
        isEditMode={isEditMode}
        isDirectMode={isDirectMode}
        member={member}
        showPassword={showPassword}
        onTogglePassword={onTogglePassword}
      />
      <PersonalSection
        register={register}
        setValue={setValue}
        errors={errors}
        isDirectMode={isDirectMode}
        hideRolePicker={hideRolePicker}
        roles={roles}
        assignableRoles={assignableRoles}
        selectedRoleId={selectedRoleId}
      />
      <BranchesSection
        register={register}
        setValue={setValue}
        errors={errors}
        branchOptions={branchOptions}
        assignableBranchIds={assignableBranchIds}
        selectedBranchIds={selectedBranchIds}
      />
      <EngagementSection
        register={register}
        setValue={setValue}
        selectedEngagementType={selectedEngagementType}
        selectedExecutiveTitle={selectedExecutiveTitle}
      />
      <JobFunctionSection
        register={register}
        setValue={setValue}
        errors={errors}
        selectedJobRole={selectedJobRole}
        specialtyOptions={specialtyOptions}
        selectedDoctorSpecialty={selectedDoctorSpecialty}
        selectedDoctorSubspecialties={selectedDoctorSubspecialties}
      />
    </>
  );
}
