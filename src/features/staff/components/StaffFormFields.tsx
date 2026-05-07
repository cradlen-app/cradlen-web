"use client";

import {
  BriefcaseBusiness,
  Eye,
  EyeOff,
  Stethoscope,
  UserRoundCog,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { type FieldErrors, type UseFormRegister } from "react-hook-form";
import { STAFF_ROLE } from "@/features/auth/lib/auth.constants";
import { cn } from "@/lib/utils";
import {
  type StaffCreateDirectFormValues,
  type StaffInviteFormValues,
} from "../lib/staff-invite.schemas";
import type { StaffMember } from "../types/staff.types";

type AnyFormValues = StaffInviteFormValues | StaffCreateDirectFormValues;

type StaffRole = { id: string; role: string };

export type StaffFormFieldsProps = {
  errors: FieldErrors<AnyFormValues>;
  isDirectMode: boolean;
  isEditMode: boolean;
  member?: StaffMember | null;
  register: UseFormRegister<AnyFormValues>;
  roles: StaffRole[];
  selectedRole: string;
  showOwnerClinical: boolean;
  showPassword: boolean;
  showSpecialty: boolean;
  onRoleChange: (roleId: string) => void;
  onTogglePassword: () => void;
};

const fieldClass =
  "h-9 w-full border-0 border-b border-gray-200 bg-transparent px-0 text-xs text-brand-black outline-none transition-colors placeholder:text-gray-300 focus:border-brand-primary focus:ring-0";

const roleIcons: Record<string, LucideIcon> = {
  [STAFF_ROLE.DOCTOR]: Stethoscope,
  [STAFF_ROLE.OWNER]: UserRoundCog,
  [STAFF_ROLE.RECEPTION]: BriefcaseBusiness,
  [STAFF_ROLE.UNKNOWN]: BriefcaseBusiness,
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

export default function StaffFormFields({
  errors,
  isDirectMode,
  isEditMode,
  member,
  register,
  roles,
  selectedRole,
  showOwnerClinical,
  showPassword,
  showSpecialty,
  onRoleChange,
  onTogglePassword,
}: StaffFormFieldsProps) {
  const t = useTranslations("staff.create");
  const inviteErrors = errors as FieldErrors<StaffInviteFormValues>;
  const directErrors = errors as FieldErrors<StaffCreateDirectFormValues>;

  return (
    <>
      {/* Login credentials section */}
      {!isEditMode && (
        <section className="space-y-3">
          <SectionTitle title={t("account")} />
          <div className="grid grid-cols-1 gap-x-8 gap-y-2">
            {isDirectMode ? (
              <>
                <label className="block">
                  <span className="text-xs font-medium text-brand-black">
                    {t("phone")}
                  </span>
                  <input
                    {...register("phone")}
                    className={fieldClass}
                    type="tel"
                    placeholder="+201001234567"
                  />
                  <FieldError message={errors.phone?.message} />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-brand-black">
                    {t("password")}
                  </span>
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
                      aria-label={
                        showPassword ? t("hidePassword") : t("showPassword")
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="size-3.5" aria-hidden="true" />
                      ) : (
                        <Eye className="size-3.5" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                  <p className="pt-1 text-[11px] text-gray-400">
                    {t("passwordHint")}
                  </p>
                  <FieldError message={directErrors.password?.message} />
                </label>
              </>
            ) : (
              <>
                {(!isEditMode || member?.email) && (
                  <label className="block">
                    <span className="text-xs font-medium text-brand-black">
                      {t("email")}
                    </span>
                    {isEditMode ? (
                      <input
                        className={cn(fieldClass, "text-gray-500")}
                        readOnly
                        value={member?.email ?? ""}
                      />
                    ) : (
                      <>
                        <input
                          {...register("email" as never)}
                          className={fieldClass}
                          type="email"
                        />
                        <FieldError message={inviteErrors.email?.message} />
                      </>
                    )}
                  </label>
                )}
              </>
            )}
          </div>
        </section>
      )}

      {/* Edit mode email display */}
      {isEditMode && member?.email && (
        <section className="space-y-3">
          <SectionTitle title={t("account")} />
          <label className="block">
            <span className="text-xs font-medium text-brand-black">
              {t("email")}
            </span>
            <input
              className={cn(fieldClass, "text-gray-500")}
              readOnly
              value={member.email}
            />
          </label>
        </section>
      )}

      {/* Personal information */}
      <section className="space-y-3">
        <SectionTitle title={t("personalInformation")} />
        <div className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-medium text-brand-black">
              {t("name")}
            </span>
            <input {...register("name")} className={fieldClass} />
            <FieldError message={errors.name?.message} />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-brand-black">
              {t("jobTitle")}
            </span>
            <input {...register("jobTitle")} className={fieldClass} />
            <FieldError message={errors.jobTitle?.message} />
          </label>

          {!isDirectMode && (
            <label className="block">
              <span className="text-xs font-medium text-brand-black">
                {t("phone")}
              </span>
              <input
                {...register("phone")}
                className={fieldClass}
                type="tel"
              />
              <FieldError message={errors.phone?.message} />
            </label>
          )}

          <div className="sm:col-span-2">
            <span className="text-xs font-medium text-brand-black">
              {t("role")}
            </span>
            <input {...register("roleId")} type="hidden" />
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {roles
                .filter((role) => role.role !== "unknown")
                .map((role) => {
                  const Icon = roleIcons[role.role] ?? BriefcaseBusiness;
                  const isSelected = selectedRole === role.role;
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => onRoleChange(role.id)}
                      aria-pressed={isSelected}
                      className={cn(
                        "flex h-14 items-center gap-2 rounded-lg border px-3 text-start transition-all",
                        "focus-visible:border-brand-primary focus-visible:ring-2 focus-visible:ring-brand-primary/20 focus-visible:outline-none",
                        isSelected
                          ? "border-brand-primary bg-brand-primary/8 text-brand-primary shadow-sm"
                          : "border-gray-100 bg-gray-50/70 text-gray-500 hover:border-brand-primary/30 hover:bg-white hover:text-brand-black",
                      )}
                    >
                      <span
                        className={cn(
                          "inline-flex size-8 shrink-0 items-center justify-center rounded-full",
                          isSelected
                            ? "bg-brand-primary text-white"
                            : "bg-white text-gray-400",
                        )}
                      >
                        <Icon className="size-4" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 text-xs font-semibold">
                        {t(`roles.${role.role}`)}
                      </span>
                    </button>
                  );
                })}
            </div>
            <FieldError message={errors.roleId?.message} />
          </div>

          {showOwnerClinical && (
            <label className="flex items-center gap-2 pt-3">
              <input
                {...register("isClinical")}
                type="checkbox"
                className="size-4 rounded border-gray-300 accent-brand-primary"
              />
              <span className="text-xs font-medium text-brand-black">
                {t("isClinical")}
              </span>
            </label>
          )}

          {showSpecialty && (
            <label className="block">
              <span className="text-xs font-medium text-brand-black">
                {t("specialty")}
              </span>
              <input {...register("specialty")} className={fieldClass} />
              <FieldError message={errors.specialty?.message} />
            </label>
          )}
        </div>
      </section>
    </>
  );
}
