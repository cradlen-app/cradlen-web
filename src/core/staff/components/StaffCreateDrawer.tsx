"use client";

import { useEffect, useMemo, useState } from "react";
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
import { useUserProfileContext } from "@/features/auth/hooks/useUserProfileContext";
import {
  DEFAULT_ENGAGEMENT_TYPE,
  STAFF_API_ROLE,
  type StaffApiRole,
} from "@/features/auth/lib/auth.constants";
import { usePermission } from "@/kernel";
import { ApiError } from "@/infrastructure/http/api";
import { cn } from "@/common/utils/utils";
import { useCreateStaffDirect } from "../hooks/useCreateStaffDirect";
import { useInviteStaff } from "../hooks/useInviteStaff";
import { useUpdateStaff } from "../hooks/useManageStaff";
import { useStaffRoles } from "../hooks/useStaffRoles";
import {
  useJobFunctions,
  useOrgBranches,
  useSpecialties,
} from "../hooks/useStaffLookups";
import {
  getDefaultStaffCreateDirectValues,
  getDefaultStaffInviteValues,
  splitStaffName,
  staffCreateDirectSchema,
  staffEditSchema,
  staffInviteSchema,
  type StaffCreateDirectFormValues,
  type StaffInviteFormValues,
} from "../lib/staff-invite.schemas";
import type { ApiStaffBranchSchedule } from "../types/staff.api.types";
import type { StaffMember } from "../types/staff.types";
import DirectCreationSuccessModal from "./DirectCreationSuccessModal";
import ScheduleShiftsSection from "./ScheduleShiftsSection";
import StaffFormFields from "./StaffFormFields";

type AnyFormValues = StaffInviteFormValues | StaffCreateDirectFormValues;

type StaffCreateDrawerProps = {
  branchId?: string;
  /** @deprecated kept for caller compatibility — multi-branch picker uses lookup. */
  branchName?: string;
  member?: StaffMember | null;
  method?: "invite" | "direct";
  mode?: "create" | "edit";
  onOpenChange: (open: boolean) => void;
  open: boolean;
  organizationId?: string;
  organizationName?: string;
};

type FieldName = "email" | "name" | "phone" | "roleId" | "shifts";

function getInviteErrorField(message: string): FieldName | null {
  const m = message.toLowerCase();
  if (m.includes("email")) return "email";
  if (m.includes("first_name") || m.includes("last_name")) return "name";
  if (m.includes("role_id")) return "roleId";
  if (m.includes("phone")) return "phone";
  if (m.includes("schedule") || m.includes("shift")) return "shifts";
  return null;
}

function getDefaultsForMember(
  member: StaffMember | null | undefined,
  branchIds: string[],
): StaffInviteFormValues {
  const defaults = getDefaultStaffInviteValues(branchIds);
  if (!member) return defaults;

  const memberBranchIds = member.branches.map((b) => b.id);
  return {
    ...defaults,
    email: member.email ?? "",
    name: [member.firstName, member.lastName].filter(Boolean).join(" "),
    phone: member.phone === "-" ? "" : member.phone,
    roleId: member.roles[0]?.id ?? "",
    branchIds: memberBranchIds.length ? memberBranchIds : branchIds,
    jobFunctionCodes: member.jobFunctions.map((fn) => fn.code),
    specialtyCodes: member.specialties.map((s) => s.code),
    executiveTitle: member.executiveTitle ?? null,
    engagementType: member.engagementType ?? DEFAULT_ENGAGEMENT_TYPE,
    shifts: defaults.shifts.map((shift) => {
      const day = member.schedule
        ?.flatMap((b) => b.days)
        .find((d) => d.day_of_week === shift.day);
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
  const { activeProfile, isOwner: callerIsOwner } = useUserProfileContext();
  const ownerCanEditRoles = usePermission("staff.editRoles");

  const { data: roleFilters = [] } = useStaffRoles(organizationId, open);
  const { data: jobFunctionOptions = [] } = useJobFunctions(open);
  const { data: specialtyOptions = [] } = useSpecialties(open);
  const { data: branchListResponse } = useOrgBranches(organizationId, open);
  const branchOptions = useMemo(
    () => branchListResponse?.data ?? [],
    [branchListResponse],
  );

  /**
   * Branches the caller is allowed to assign. Backend treats branch_ids as a
   * replace, so a BRANCH_MANAGER may only add/remove branches within their own
   * scope. OWNER has no scope restriction (empty set means "all").
   */
  const callerBranchIds = useMemo(
    () =>
      callerIsOwner
        ? new Set<string>()
        : new Set((activeProfile?.branches ?? []).map((b) => b.id ?? b.branch_id ?? "")),
    [callerIsOwner, activeProfile],
  );

  const [formError, setFormError] = useState<string | null>(null);
  const [successCredentials, setSuccessCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const isEditMode = mode === "edit";
  const isDirectMode = !isEditMode && method === "direct";
  const initialBranchIds = useMemo(
    () => (branchId ? [branchId] : []),
    [branchId],
  );

  const inviteForm = useForm<StaffInviteFormValues>({
    defaultValues: getDefaultStaffInviteValues(initialBranchIds),
    resolver: zodResolver(isEditMode ? staffEditSchema : staffInviteSchema),
  });

  const directForm = useForm<StaffCreateDirectFormValues>({
    defaultValues: getDefaultStaffCreateDirectValues(initialBranchIds),
    resolver: zodResolver(staffCreateDirectSchema),
  });

  const activeForm = isDirectMode ? directForm : inviteForm;
  const {
    formState: { errors },
    handleSubmit,
    register,
    setError,
    setValue,
    control,
  } = activeForm as unknown as ReturnType<typeof useForm<StaffInviteFormValues>>;

  const selectedRoleId = useWatch({ control, name: "roleId" }) ?? "";
  const jobFunctionCodes = useWatch({ control, name: "jobFunctionCodes" }) ?? [];
  const specialtyCodes = useWatch({ control, name: "specialtyCodes" }) ?? [];
  const selectedBranchIds = useWatch({ control, name: "branchIds" }) ?? [];
  const engagementType =
    useWatch({ control, name: "engagementType" }) ?? DEFAULT_ENGAGEMENT_TYPE;
  const executiveTitle = useWatch({ control, name: "executiveTitle" });
  const shifts = useWatch({ control, name: "shifts" });

  // Roles a non-OWNER may not assign.
  const assignableRoles = useMemo<Set<StaffApiRole>>(() => {
    if (ownerCanEditRoles) {
      // OWNER can assign anything except OWNER itself (backend rejects 400).
      return new Set([
        STAFF_API_ROLE.BRANCH_MANAGER,
        STAFF_API_ROLE.STAFF,
        STAFF_API_ROLE.EXTERNAL,
      ]);
    }
    return new Set([STAFF_API_ROLE.STAFF, STAFF_API_ROLE.EXTERNAL]);
  }, [ownerCanEditRoles]);

  const hideRolePicker = isEditMode && !ownerCanEditRoles;

  useEffect(() => {
    if (isEditMode) {
      inviteForm.reset(getDefaultsForMember(member, initialBranchIds));
    } else if (isDirectMode) {
      directForm.reset(getDefaultStaffCreateDirectValues(initialBranchIds));
    } else {
      inviteForm.reset(getDefaultStaffInviteValues(initialBranchIds));
    }
  }, [open, method, mode, member, initialBranchIds]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setFormError(null);
      setShowPassword(false);
    }
    onOpenChange(nextOpen);
  };

  const enabledSchedule: ApiStaffBranchSchedule[] = useMemo(() => {
    if (!branchId || !shifts) return [];
    const days = shifts
      .filter((s) => s.enabled)
      .map((s) => ({
        day_of_week: s.day,
        shifts: [{ start_time: s.startTime, end_time: s.endTime }],
      }));
    return days.length ? [{ branch_id: branchId, days }] : [];
  }, [branchId, shifts]);

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

          if (values.branchIds.length === 0) {
            toast.error(t("errors.atLeastOneBranch"));
            return;
          }

          await updateStaff.mutateAsync({
            organizationId,
            staffId: member.id,
            data: {
              first_name: firstName,
              last_name: lastName,
              ...(values.phone ? { phone_number: values.phone } : {}),
              ...(ownerCanEditRoles && values.roleId
                ? { role_ids: [values.roleId] }
                : {}),
              branch_ids: values.branchIds,
              job_function_codes: values.jobFunctionCodes,
              specialty_codes: values.specialtyCodes,
              executive_title: values.executiveTitle ?? null,
              engagement_type: values.engagementType,
            },
          });

          toast.success(t("edit.success"));
          onOpenChange(false);
          return;
        }

        if (isDirectMode) {
          const directValues = values as unknown as StaffCreateDirectFormValues;
          const result = await createDirect.mutateAsync({
            organizationId,
            data: {
              first_name: firstName,
              last_name: lastName,
              phone_number: directValues.phone,
              password: directValues.password,
              role_ids: [directValues.roleId],
              branch_ids: directValues.branchIds,
              job_function_codes: directValues.jobFunctionCodes,
              specialty_codes: directValues.specialtyCodes,
              executive_title: directValues.executiveTitle ?? null,
              engagement_type: directValues.engagementType,
              ...(enabledSchedule.length ? { schedule: enabledSchedule } : {}),
            },
          });

          onOpenChange(false);
          directForm.reset(getDefaultStaffCreateDirectValues(initialBranchIds));
          setSuccessCredentials({
            email: result.data.generated_email,
            password: directValues.password,
          });
          return;
        }

        // Invite by email
        const inviteValues = values as StaffInviteFormValues;
        await inviteStaff.mutateAsync({
          organizationId,
          data: {
            email: inviteValues.email,
            first_name: firstName,
            last_name: lastName,
            ...(inviteValues.phone ? { phone_number: inviteValues.phone } : {}),
            role_ids: [inviteValues.roleId],
            branch_ids: inviteValues.branchIds,
            job_function_codes: inviteValues.jobFunctionCodes,
            specialty_codes: inviteValues.specialtyCodes,
            executive_title: inviteValues.executiveTitle ?? null,
            engagement_type: inviteValues.engagementType,
          },
        });

        toast.success(t("success"));
        onOpenChange(false);
        inviteForm.reset(getDefaultStaffInviteValues(initialBranchIds));
      } catch (error) {
        if (error instanceof ApiError) {
          if (
            error.status === 409 ||
            error.messages.some((m) =>
              m.toLowerCase().includes("pending invitation already exists"),
            )
          ) {
            const message = t("errors.pendingInvitation");
            if (!isDirectMode) setError("email" as never, { type: "server", message });
            toast.error(message);
            return;
          }

          if (error.status === 400) {
            let didSet = false;
            error.messages.forEach((m) => {
              const field = getInviteErrorField(m);
              if (!field) return;
              didSet = true;
              setError(field as never, { type: "server", message: m });
            });
            if (didSet) {
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

            <form onSubmit={onSubmit} className="mt-6 flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto pe-1">
                {formError && (
                  <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600">
                    {formError}
                  </div>
                )}

                <section className="space-y-3">
                  <div className="flex items-center gap-4">
                    <p className="shrink-0 text-xs font-medium text-gray-400">
                      {t("organization")}
                    </p>
                    <span className="h-px flex-1 bg-gray-300" />
                  </div>
                  <input
                    className="h-9 w-full border-0 border-b border-gray-200 bg-transparent px-0 text-xs text-gray-500 outline-none"
                    readOnly
                    value={organizationName ?? ""}
                  />
                </section>

                <StaffFormFields
                  errors={errors as FieldErrors<AnyFormValues>}
                  isDirectMode={isDirectMode}
                  isEditMode={isEditMode}
                  member={member}
                  register={register as UseFormRegister<AnyFormValues>}
                  setValue={setValue as never}
                  roles={roleFilters}
                  assignableRoles={assignableRoles}
                  selectedRoleId={selectedRoleId}
                  selectedJobFunctionCodes={jobFunctionCodes}
                  selectedSpecialtyCodes={specialtyCodes}
                  selectedEngagementType={engagementType}
                  selectedExecutiveTitle={executiveTitle ?? null}
                  jobFunctionOptions={jobFunctionOptions}
                  specialtyOptions={specialtyOptions}
                  branchOptions={branchOptions}
                  selectedBranchIds={selectedBranchIds}
                  assignableBranchIds={callerBranchIds}
                  showPassword={showPassword}
                  hideRolePicker={hideRolePicker}
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
        credentials={successCredentials}
        onClose={() => setSuccessCredentials(null)}
      />
    </>
  );
}
