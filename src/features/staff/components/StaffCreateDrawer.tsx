"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Dialog } from "radix-ui";
import {
  type Control,
  type FieldErrors,
  useForm,
  type UseFormRegister,
  useWatch,
} from "react-hook-form";
import { toast } from "sonner";
import { STAFF_ROLE } from "@/features/auth/lib/auth.constants";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useCreateStaffDirect } from "../hooks/useCreateStaffDirect";
import { useInviteStaff } from "../hooks/useInviteStaff";
import { useUpdateStaff } from "../hooks/useManageStaff";
import { useStaffRoles } from "../hooks/useStaffRoles";
import {
  getDefaultStaffCreateDirectValues,
  getDefaultStaffInviteValues,
  staffCreateDirectSchema,
  staffEditSchema,
  staffInviteSchema,
  splitStaffName,
  type StaffCreateDirectFormValues,
  type StaffInviteFormValues,
} from "../lib/staff-invite.schemas";
import type { StaffMember } from "../types/staff.types";
import DirectCreationSuccessModal from "./DirectCreationSuccessModal";
import ScheduleShiftsSection from "./ScheduleShiftsSection";
import StaffFormFields from "./StaffFormFields";

type AnyFormValues = StaffInviteFormValues | StaffCreateDirectFormValues;

type StaffCreateDrawerProps = {
  branchId?: string;
  branchName?: string;
  member?: StaffMember | null;
  method?: "invite" | "direct";
  mode?: "create" | "edit";
  onOpenChange: (open: boolean) => void;
  open: boolean;
  organizationId?: string;
  organizationName?: string;
};

type InviteFieldName =
  | "email"
  | "jobTitle"
  | "name"
  | "phone"
  | "roleId"
  | "shifts"
  | "specialty";

function getInviteErrorField(message: string): InviteFieldName | null {
  const normalized = message.toLowerCase();
  if (normalized.includes("email")) return "email";
  if (normalized.includes("first_name") || normalized.includes("last_name"))
    return "name";
  if (normalized.includes("role_id")) return "roleId";
  if (normalized.includes("job_title")) return "jobTitle";
  if (normalized.includes("specialty")) return "specialty";
  if (normalized.includes("phone")) return "phone";
  if (
    normalized.includes("branch") ||
    normalized.includes("schedule") ||
    normalized.includes("shift")
  )
    return "shifts";
  return null;
}

function getStaffFormValues(
  member: StaffMember | null | undefined,
): StaffInviteFormValues {
  const defaults = getDefaultStaffInviteValues();
  if (!member) return defaults;

  return {
    ...defaults,
    email: member.email ?? "",
    isClinical:
      member.roles?.includes(STAFF_ROLE.DOCTOR) ??
      member.role === STAFF_ROLE.DOCTOR,
    jobTitle: member.jobTitle,
    name: [member.firstName, member.lastName].filter(Boolean).join(" "),
    phone: member.phone === "-" ? "" : member.phone,
    role: member.role === STAFF_ROLE.UNKNOWN ? STAFF_ROLE.DOCTOR : member.role,
    roleId: member.roleId ?? "",
    specialty: member.specialty,
    shifts: defaults.shifts.map((shift) => {
      const day = member.schedule?.days.find(
        (d) => d.day_of_week === shift.day,
      );
      const firstShift = day?.shifts[0];
      return {
        ...shift,
        enabled: !!firstShift,
        startTime: firstShift?.start_time ?? shift.startTime,
        endTime: firstShift?.end_time ?? shift.endTime,
      };
    }),
  };
}

export function StaffCreateDrawer({
  branchId,
  branchName,
  member,
  method = "invite",
  mode = "create",
  onOpenChange,
  open,
  organizationId,
  organizationName,
}: StaffCreateDrawerProps) {
  const t = useTranslations("staff.create");
  const inviteStaff = useInviteStaff();
  const createDirect = useCreateStaffDirect();
  const updateStaff = useUpdateStaff();
  const { data: roleFilters = [] } = useStaffRoles(organizationId);
  const [formError, setFormError] = useState<string | null>(null);
  const [generatedEmail, setGeneratedEmail] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const isEditMode = mode === "edit";
  const isDirectMode = !isEditMode && method === "direct";

  // Invite / edit form
  const inviteForm = useForm<StaffInviteFormValues>({
    defaultValues: getStaffFormValues(isEditMode ? member : null),
    resolver: zodResolver(isEditMode ? staffEditSchema : staffInviteSchema),
  });

  // Direct creation form
  const directForm = useForm<StaffCreateDirectFormValues>({
    defaultValues: getDefaultStaffCreateDirectValues(),
    resolver: zodResolver(staffCreateDirectSchema),
  });

  const activeForm = isDirectMode ? directForm : inviteForm;
  // Cast through unknown: both forms share all base fields; the extra `password` field in direct
  // mode is accessed safely via explicit cast in the submit handler.
  const {
    formState: { errors },
    handleSubmit,
    register,
    setError,
    setValue,
    control,
  } = activeForm as unknown as ReturnType<
    typeof useForm<StaffInviteFormValues>
  >;

  const selectedRole = useWatch({ control, name: "role" });
  const isClinical = useWatch({ control, name: "isClinical" });
  const shifts = useWatch({ control, name: "shifts" });
  const showOwnerClinical = selectedRole === STAFF_ROLE.OWNER;
  const showSpecialty =
    selectedRole === STAFF_ROLE.DOCTOR ||
    (selectedRole === STAFF_ROLE.OWNER && isClinical);

  useEffect(() => {
    if (isEditMode) {
      inviteForm.reset(getStaffFormValues(member));
    } else if (isDirectMode) {
      directForm.reset(getDefaultStaffCreateDirectValues());
    } else {
      inviteForm.reset(getDefaultStaffInviteValues());
    }
  }, [open, method, mode, member]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setFormError(null);
      setShowPassword(false);
    }
    onOpenChange(nextOpen);
  };

  const handleRoleChange = (roleId: string) => {
    const selected = roleFilters.find((role) => role.id === roleId);
    const selectedRoleValue =
      !selected || selected.role === STAFF_ROLE.UNKNOWN
        ? STAFF_ROLE.DOCTOR
        : selected.role;

    setValue("roleId", roleId, { shouldDirty: true, shouldValidate: true });
    setValue("role", selectedRoleValue, {
      shouldDirty: true,
      shouldValidate: true,
    });

    if (selectedRoleValue !== STAFF_ROLE.OWNER) {
      setValue("isClinical", false, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
    if (selectedRoleValue === STAFF_ROLE.RECEPTION) {
      setValue("specialty", "", { shouldDirty: true, shouldValidate: true });
    }
  };

  const enabledShifts = (shifts ?? [])
    .filter((s) => s.enabled)
    .map((s) => ({
      day_of_week: s.day,
      shifts: [{ start_time: s.startTime, end_time: s.endTime }],
    }));

  const onSubmit = handleSubmit(
    async (values) => {
      setFormError(null);

      if (!organizationId || !branchId) {
        toast.error(t("missingOrganization"));
        return;
      }

      const { firstName, lastName } = splitStaffName(values.name);

      try {
        if (isEditMode) {
          if (!member) {
            toast.error(t("edit.missingStaff"));
            return;
          }

          await updateStaff.mutateAsync({
            branchId,
            data: {
              first_name: firstName,
              last_name: lastName,
              ...(values.phone ? { phone_number: values.phone } : {}),
              role_ids: [values.roleId],
              branch_ids: [branchId],
              job_title: values.jobTitle,
              ...(showSpecialty && values.specialty
                ? { specialty: values.specialty }
                : {}),
            },
            organizationId,
            staffId: member.id,
          });

          toast.success(t("edit.success"));
          onOpenChange(false);
          inviteForm.reset(getDefaultStaffInviteValues());
          return;
        }

        if (isDirectMode) {
          const directValues = values as unknown as StaffCreateDirectFormValues;
          const result = await createDirect.mutateAsync({
            organizationId: organizationId,
            data: {
              first_name: firstName,
              last_name: lastName,
              phone_number: directValues.phone,
              password: directValues.password,
              role_ids: [directValues.roleId],
              branch_ids: [branchId],
              job_title: directValues.jobTitle || undefined,
              ...(showSpecialty && directValues.specialty
                ? { specialty: directValues.specialty }
                : {}),
              is_clinical: directValues.isClinical || undefined,
              ...(enabledShifts.length > 0
                ? { schedule: [{ branch_id: branchId, days: enabledShifts }] }
                : {}),
            },
          });

          onOpenChange(false);
          directForm.reset(getDefaultStaffCreateDirectValues());
          setGeneratedEmail(result.data.generated_email);
          return;
        }

        // Invite by email
        const inviteValues = values as StaffInviteFormValues;
        await inviteStaff.mutateAsync({
          organizationId: organizationId,
          data: {
            first_name: firstName,
            last_name: lastName,
            email: inviteValues.email,
            role_ids: [inviteValues.roleId],
            branch_ids: [branchId],
            ...(inviteValues.phone ? { phone_number: inviteValues.phone } : {}),
            job_title: inviteValues.jobTitle || undefined,
            ...(showSpecialty && inviteValues.specialty
              ? { specialty: inviteValues.specialty }
              : {}),
            is_clinical: inviteValues.isClinical || undefined,
          },
        });

        toast.success(t("success"));
        onOpenChange(false);
        inviteForm.reset(getDefaultStaffInviteValues());
      } catch (error) {
        if (error instanceof ApiError) {
          if (
            error.status === 409 ||
            error.messages.some((m) =>
              m.toLowerCase().includes("pending invitation already exists"),
            )
          ) {
            const message = t("errors.pendingInvitation");
            if (!isDirectMode)
              setError("email" as never, { type: "server", message });
            toast.error(message);
            return;
          }

          if (error.status === 400) {
            let didSetFieldError = false;
            error.messages.forEach((message) => {
              const field = getInviteErrorField(message);
              if (!field) return;
              didSetFieldError = true;
              setError(field as never, { type: "server", message });
            });
            if (didSetFieldError) {
              setFormError(t("errors.reviewFields"));
              toast.error(t("errors.reviewFields"));
              return;
            }
          }

          const message = error.messages[0] || t("error");
          setFormError(message);
          toast.error(message);
          return;
        }

        setFormError(t("error"));
        toast.error(t("error"));
      }
    },
    () => {
      setFormError(t("errors.reviewFields"));
      toast.error(t("errors.reviewFields"));
    },
  );

  const isPending =
    inviteStaff.isPending || createDirect.isPending || updateStaff.isPending;

  return (
    <>
      <Dialog.Root open={open} onOpenChange={handleOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/35" />
          <Dialog.Content
            className={cn(
              "fixed inset-0 z-50 flex h-dvh w-full flex-col bg-white px-5 py-5 shadow-2xl outline-none",
              "sm:inset-y-0 sm:start-auto sm:inset-e-0 sm:w-107.5 sm:max-w-[calc(100vw-2rem)]",
              "sm:ltr:rounded-l-2xl sm:rtl:rounded-r-2xl",
            )}
          >
            <div className="flex items-center justify-between gap-4">
              <Dialog.Title className="text-lg font-medium text-brand-black">
                {isEditMode
                  ? t("edit.title")
                  : isDirectMode
                    ? t("directTitle")
                    : t("title")}
              </Dialog.Title>
              <Dialog.Description className="sr-only">
                {isEditMode ? t("edit.description") : t("description")}
              </Dialog.Description>
              <Dialog.Close
                className="inline-flex size-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-brand-black"
                aria-label={isEditMode ? t("edit.close") : t("close")}
              >
                <X className="size-5" aria-hidden="true" />
              </Dialog.Close>
            </div>

            <form
              onSubmit={onSubmit}
              className="mt-6 flex min-h-0 flex-1 flex-col"
            >
              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto pe-1">
                {formError && (
                  <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600">
                    {formError}
                  </div>
                )}

                {/* Organization & Branch */}
                <section className="space-y-3">
                  <div className="flex items-center gap-4">
                    <p className="shrink-0 text-xs font-medium text-gray-400">
                      {t("organizationAndBranch")}
                    </p>
                    <span className="h-px flex-1 bg-gray-300" />
                  </div>
                  <div className="grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2">
                    <label className="block">
                      <span className="text-xs font-medium text-brand-black">
                        {t("organization")}
                      </span>
                      <input
                        className="h-9 w-full border-0 border-b border-gray-200 bg-transparent px-0 text-xs text-gray-500 outline-none"
                        readOnly
                        value={organizationName ?? ""}
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-medium text-brand-black">
                        {t("branch")}
                      </span>
                      <input
                        className="h-9 w-full border-0 border-b border-gray-200 bg-transparent px-0 text-xs text-gray-500 outline-none"
                        readOnly
                        value={branchName ?? ""}
                      />
                    </label>
                  </div>
                </section>

                <StaffFormFields
                  errors={errors as FieldErrors<AnyFormValues>}
                  isDirectMode={isDirectMode}
                  isEditMode={isEditMode}
                  member={member}
                  register={register as UseFormRegister<AnyFormValues>}
                  roles={roleFilters}
                  selectedRole={selectedRole}
                  showOwnerClinical={showOwnerClinical}
                  showPassword={showPassword}
                  showSpecialty={showSpecialty}
                  onRoleChange={handleRoleChange}
                  onTogglePassword={() => setShowPassword((v) => !v)}
                />

                {(isEditMode || isDirectMode) && (
                  <ScheduleShiftsSection
                    control={control as Control<AnyFormValues>}
                    errors={errors as FieldErrors<AnyFormValues>}
                    isDirectMode={isDirectMode}
                    register={register as UseFormRegister<AnyFormValues>}
                  />
                )}
              </div>

              <div className="flex justify-end border-t border-gray-100 pt-3">
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex h-8 min-w-20 items-center justify-center rounded-full bg-brand-primary px-5 text-xs font-semibold text-white transition-colors hover:bg-brand-primary/90 disabled:opacity-50"
                >
                  {isEditMode
                    ? updateStaff.isPending
                      ? t("edit.saving")
                      : t("edit.save")
                    : isDirectMode
                      ? createDirect.isPending
                        ? t("creating")
                        : t("create")
                      : inviteStaff.isPending
                        ? t("inviting")
                        : t("invite")}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <DirectCreationSuccessModal
        email={generatedEmail}
        onClose={() => setGeneratedEmail(null)}
      />
    </>
  );
}
