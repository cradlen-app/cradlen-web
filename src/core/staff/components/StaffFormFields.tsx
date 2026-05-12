"use client";

import {
  BriefcaseBusiness,
  Eye,
  EyeOff,
  ShieldCheck,
  Stethoscope,
  UserRoundCog,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import {
  type FieldErrors,
  type UseFormRegister,
  type UseFormSetValue,
} from "react-hook-form";
import {
  ENGAGEMENT_TYPE,
  EXECUTIVE_TITLE,
  STAFF_API_ROLE,
  type EngagementTypeCode,
  type ExecutiveTitleCode,
  type StaffApiRole,
} from "@/features/auth/lib/auth.constants";
import { cn } from "@/common/utils/utils";
import {
  type StaffCreateDirectFormValues,
  type StaffInviteFormValues,
} from "../lib/staff-invite.schemas";
import type {
  ApiStaffJobFunction,
  ApiStaffSpecialty,
} from "../types/staff.api.types";
import type { StaffMember, StaffRoleOption } from "../types/staff.types";
import type { OrganizationBranch } from "@/features/settings/lib/settings.api";

type AnyFormValues = StaffInviteFormValues | StaffCreateDirectFormValues;

const fieldClass =
  "h-9 w-full border-0 border-b border-gray-200 bg-transparent px-0 text-xs text-brand-black outline-none transition-colors placeholder:text-gray-300 focus:border-brand-primary focus:ring-0";

const roleIcons: Record<string, LucideIcon> = {
  [STAFF_API_ROLE.OWNER]: UserRoundCog,
  [STAFF_API_ROLE.BRANCH_MANAGER]: ShieldCheck,
  [STAFF_API_ROLE.STAFF]: Stethoscope,
  [STAFF_API_ROLE.EXTERNAL]: BriefcaseBusiness,
};

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
  selectedJobFunctionCodes: string[];
  selectedSpecialtyCodes: string[];
  selectedEngagementType: EngagementTypeCode;
  selectedExecutiveTitle: ExecutiveTitleCode | null | undefined;
  jobFunctionOptions: ApiStaffJobFunction[];
  specialtyOptions: ApiStaffSpecialty[];
  branchOptions: OrganizationBranch[];
  selectedBranchIds: string[];
  /** Branches the current user is allowed to assign (BRANCH_MANAGER scope). Empty = no scope restriction. */
  assignableBranchIds: Set<string>;
  showPassword: boolean;
  /** Hide the role picker (e.g. BRANCH_MANAGER editing). */
  hideRolePicker?: boolean;
  onTogglePassword: () => void;
};

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-4">
      <p className="shrink-0 text-xs font-medium text-gray-400">{title}</p>
      <span className="h-px flex-1 bg-gray-300" />
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="pt-1 text-[11px] text-red-500">{message}</p>;
}

function ChipToggle({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "rounded-full border px-3 py-1 text-xs transition-all",
        selected
          ? "border-brand-primary bg-brand-primary/10 text-brand-primary"
          : "border-gray-200 bg-white text-gray-500 hover:border-brand-primary/30 hover:text-brand-black",
      )}
    >
      {label}
    </button>
  );
}

const ENGAGEMENT_VALUES = Object.values(ENGAGEMENT_TYPE);
const EXECUTIVE_VALUES = Object.values(EXECUTIVE_TITLE);

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
  selectedJobFunctionCodes,
  selectedSpecialtyCodes,
  selectedEngagementType,
  selectedExecutiveTitle,
  jobFunctionOptions,
  specialtyOptions,
  branchOptions,
  selectedBranchIds,
  assignableBranchIds,
  showPassword,
  hideRolePicker,
  onTogglePassword,
}: StaffFormFieldsProps) {
  const t = useTranslations("staff.create");
  const directErrors = errors as FieldErrors<StaffCreateDirectFormValues>;
  const inviteErrors = errors as FieldErrors<StaffInviteFormValues>;

  const visibleRoles = roles.filter(
    (r) => r.role !== "UNKNOWN" && assignableRoles.has(r.role as StaffApiRole),
  );

  function toggleArrayValue(
    field: "jobFunctionCodes" | "specialtyCodes" | "branchIds",
    current: string[],
    code: string,
  ) {
    const next = current.includes(code)
      ? current.filter((c) => c !== code)
      : [...current, code];
    setValue(field, next, { shouldDirty: true, shouldValidate: true });
  }

  return (
    <>
      {/* Account section */}
      {!isEditMode && (
        <section className="space-y-3">
          <SectionTitle title={t("account")} />
          <div className="grid grid-cols-1 gap-x-8 gap-y-2">
            {isDirectMode ? (
              <>
                <label className="block">
                  <span className="text-xs font-medium text-brand-black">{t("phone")}</span>
                  <input
                    {...register("phone")}
                    className={fieldClass}
                    type="tel"
                    placeholder="+201001234567"
                  />
                  <FieldError message={errors.phone?.message} />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-brand-black">{t("password")}</span>
                  <div className="relative">
                    <input
                      {...register("password" as never)}
                      className={cn(fieldClass, "pe-8")}
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={onTogglePassword}
                      className="absolute inset-y-0 inset-e-0 flex items-center text-gray-400 hover:text-brand-black"
                      aria-label={showPassword ? t("hidePassword") : t("showPassword")}
                    >
                      {showPassword ? (
                        <EyeOff className="size-3.5" aria-hidden="true" />
                      ) : (
                        <Eye className="size-3.5" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                  <p className="pt-1 text-[11px] text-gray-400">{t("passwordHint")}</p>
                  <FieldError message={directErrors.password?.message} />
                </label>
              </>
            ) : (
              <label className="block">
                <span className="text-xs font-medium text-brand-black">{t("email")}</span>
                <input {...register("email" as never)} className={fieldClass} type="email" />
                <FieldError message={inviteErrors.email?.message} />
              </label>
            )}
          </div>
        </section>
      )}

      {isEditMode && member?.email && (
        <section className="space-y-3">
          <SectionTitle title={t("account")} />
          <label className="block">
            <span className="text-xs font-medium text-brand-black">{t("email")}</span>
            <input
              className={cn(fieldClass, "text-gray-500")}
              readOnly
              value={member.email}
            />
          </label>
        </section>
      )}

      {/* Personal info */}
      <section className="space-y-3">
        <SectionTitle title={t("personalInformation")} />
        <div className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-medium text-brand-black">{t("name")}</span>
            <input {...register("name")} className={fieldClass} />
            <FieldError message={errors.name?.message} />
          </label>

          {!isDirectMode && (
            <label className="block">
              <span className="text-xs font-medium text-brand-black">{t("phone")}</span>
              <input {...register("phone")} className={fieldClass} type="tel" />
              <FieldError message={errors.phone?.message} />
            </label>
          )}

          {!hideRolePicker && (
            <div className="sm:col-span-2">
              <span className="text-xs font-medium text-brand-black">{t("role")}</span>
              <input {...register("roleId")} type="hidden" />
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                {visibleRoles.map((roleOpt) => {
                  const Icon = roleIcons[roleOpt.role] ?? BriefcaseBusiness;
                  const isSelected = selectedRoleId === roleOpt.id;
                  return (
                    <button
                      key={roleOpt.id}
                      type="button"
                      onClick={() =>
                        setValue("roleId", roleOpt.id, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                      aria-pressed={isSelected}
                      className={cn(
                        "flex h-14 items-center gap-2 rounded-lg border px-3 text-start transition-all",
                        isSelected
                          ? "border-brand-primary bg-brand-primary/8 text-brand-primary shadow-sm"
                          : "border-gray-100 bg-gray-50/70 text-gray-500 hover:border-brand-primary/30 hover:bg-white hover:text-brand-black",
                      )}
                    >
                      <span
                        className={cn(
                          "inline-flex size-8 shrink-0 items-center justify-center rounded-full",
                          isSelected ? "bg-brand-primary text-white" : "bg-white text-gray-400",
                        )}
                      >
                        <Icon className="size-4" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 text-xs font-semibold">
                        {t(`apiRoles.${roleOpt.role}`)}
                      </span>
                    </button>
                  );
                })}
              </div>
              <FieldError message={errors.roleId?.message} />
            </div>
          )}
        </div>
      </section>

      {/* Branches */}
      <section className="space-y-3">
        <SectionTitle title={t("branches")} />
        <input {...register("branchIds" as never)} type="hidden" />
        <div className="flex flex-wrap gap-2">
          {branchOptions.length === 0 ? (
            <p className="text-[11px] text-gray-400">{t("noBranches")}</p>
          ) : (
            branchOptions.map((branch) => {
              const inScope =
                assignableBranchIds.size === 0 || assignableBranchIds.has(branch.id);
              const isSelected = selectedBranchIds.includes(branch.id);
              const wouldAdd = !isSelected;
              const disabled = !inScope && wouldAdd;
              return (
                <ChipToggle
                  key={branch.id}
                  label={branch.city ? `${branch.name} (${branch.city})` : branch.name}
                  selected={isSelected}
                  onClick={() =>
                    !disabled &&
                    toggleArrayValue("branchIds", selectedBranchIds, branch.id)
                  }
                />
              );
            })
          )}
        </div>
        {errors.branchIds?.message && (
          <FieldError message={errors.branchIds.message as string} />
        )}
      </section>

      {/* Engagement + executive title */}
      <section className="space-y-3">
        <SectionTitle title={t("engagement")} />
        <div className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
          <div>
            <span className="text-xs font-medium text-brand-black">{t("engagementType")}</span>
            <input {...register("engagementType")} type="hidden" />
            <div className="mt-2 flex flex-wrap gap-2">
              {ENGAGEMENT_VALUES.map((value) => (
                <ChipToggle
                  key={value}
                  label={t(`engagementTypes.${value}`)}
                  selected={selectedEngagementType === value}
                  onClick={() =>
                    setValue("engagementType", value, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                />
              ))}
            </div>
          </div>

          <div>
            <span className="text-xs font-medium text-brand-black">{t("executiveTitle")}</span>
            <input {...register("executiveTitle")} type="hidden" />
            <div className="mt-2 flex flex-wrap gap-2">
              <ChipToggle
                label={t("executiveTitles.NONE")}
                selected={!selectedExecutiveTitle}
                onClick={() =>
                  setValue("executiveTitle", null, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              />
              {EXECUTIVE_VALUES.map((value) => (
                <ChipToggle
                  key={value}
                  label={t(`executiveTitles.${value}`)}
                  selected={selectedExecutiveTitle === value}
                  onClick={() =>
                    setValue("executiveTitle", value, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Job functions */}
      <section className="space-y-3">
        <SectionTitle title={t("jobFunctions")} />
        <input {...register("jobFunctionCodes" as never)} type="hidden" />
        <div className="flex flex-wrap gap-2">
          {jobFunctionOptions.length === 0 ? (
            <p className="text-[11px] text-gray-400">{t("noJobFunctions")}</p>
          ) : (
            jobFunctionOptions.map((fn) => (
              <ChipToggle
                key={fn.code}
                label={fn.name}
                selected={selectedJobFunctionCodes.includes(fn.code)}
                onClick={() =>
                  toggleArrayValue(
                    "jobFunctionCodes",
                    selectedJobFunctionCodes,
                    fn.code,
                  )
                }
              />
            ))
          )}
        </div>
      </section>

      {/* Specialties */}
      <section className="space-y-3">
        <SectionTitle title={t("specialties")} />
        <input {...register("specialtyCodes" as never)} type="hidden" />
        <div className="flex flex-wrap gap-2">
          {specialtyOptions.length === 0 ? (
            <p className="text-[11px] text-gray-400">{t("noSpecialties")}</p>
          ) : (
            specialtyOptions.map((sp) => (
              <ChipToggle
                key={sp.code}
                label={sp.name}
                selected={selectedSpecialtyCodes.includes(sp.code)}
                onClick={() =>
                  toggleArrayValue(
                    "specialtyCodes",
                    selectedSpecialtyCodes,
                    sp.code,
                  )
                }
              />
            ))
          )}
        </div>
      </section>
    </>
  );
}
