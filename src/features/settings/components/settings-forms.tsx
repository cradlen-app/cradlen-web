"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CURRENT_USER_QUERY_KEY } from "@/features/auth/hooks/useCurrentUser";
import { ApiError } from "@/lib/api";
import { getSubscriptionLimit } from "@/lib/subscription-errors";
import { queryClient } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";
import { cn } from "@/lib/utils";
import type { CurrentUser, UserProfile } from "@/types/user.types";
import {
  createBranch,
  updateBranch,
  updateOrganization,
  updateProfile,
  type CreateBranchRequest,
  type UpdateBranchRequest,
  type UpdateProfileRequest,
} from "../lib/settings.api";
import {
  useJobFunctionsLookup,
  useProfileLookups,
  useSpecialtiesLookup,
} from "../hooks/useSettingsLookups";
import {
  branchFormSchema,
  organizationFormSchema,
  profileFormSchema,
  type BranchFormData,
  type OrganizationFormData,
  type ProfileFormData,
} from "../lib/settings.schemas";
import { CodeMultiSelect } from "./CodeMultiSelect";
import type { DrawerKey } from "./settings.types";
import { pickDirty, type SettingsT } from "./settings.utils";
import { DrawerActions } from "./settings-ui";
import type { OrganizationBranch } from "../lib/settings.api";

type SettingsFormProps = {
  activeDrawer: DrawerKey;
  branches?: OrganizationBranch[];
  branchId?: string;
  cancelLabel: string;
  onDone: () => void;
  profile?: UserProfile;
  t: SettingsT;
  user: CurrentUser;
};

function getProfileSpecialtyCodes(profile?: UserProfile): string[] {
  return profile?.specialties?.map((s) => s.code) ?? [];
}

function getProfileJobFunctionCodes(profile?: UserProfile): string[] {
  return profile?.job_functions?.map((j) => j.code) ?? [];
}

function getOrganizationSpecialtyCodes(profile?: UserProfile): string[] {
  const list = profile?.organization?.specialties;
  if (!list?.length) return [];
  return list.map((s) => (typeof s === "string" ? s : s.code));
}

function fieldClass(error?: unknown) {
  return cn(
    "h-10 rounded-lg border bg-white px-3 text-sm text-brand-black outline-none transition focus:border-brand-primary/60 focus:ring-2 focus:ring-brand-primary/10",
    error ? "border-red-300" : "border-gray-200",
  );
}

function FieldLabel({
  htmlFor,
  required,
  children,
}: {
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="flex items-center gap-1 text-sm text-brand-black"
    >
      <span>{children}</span>
      {required && <span className="text-red-500">*</span>}
    </label>
  );
}

export function ProfileForm({
  cancelLabel,
  onDone,
  profile,
  t,
  user,
}: SettingsFormProps) {
  const profileLookups = useProfileLookups();
  const specialtiesLookup = useSpecialtiesLookup();
  const jobFunctionsLookup = useJobFunctionsLookup();
  const profileEnums = profileLookups.data?.data;
  const specialtyOptions =
    specialtiesLookup.data?.data?.map((s) => ({ code: s.code, label: s.name })) ?? [];
  const jobFunctionOptions =
    jobFunctionsLookup.data?.data?.map((j) => ({ code: j.code, label: j.name })) ?? [];

  const initial = useMemo<ProfileFormData>(
    () => ({
      first_name: user.first_name ?? "",
      last_name: user.last_name ?? "",
      phone_number: user.phone_number ?? user.phone ?? "",
      executive_title: profile?.executive_title ?? "",
      engagement_type: profile?.engagement_type ?? "FULL_TIME",
      job_function_codes: getProfileJobFunctionCodes(profile),
      specialty_codes: getProfileSpecialtyCodes(profile),
    }),
    [user, profile],
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: initial,
  });

  const jobFunctionCodes = watch("job_function_codes");
  const specialtyCodes = watch("specialty_codes");

  async function onSubmit(values: ProfileFormData) {
    if (!profile?.staff_id) {
      toast.error(t("profile.updateError"));
      return;
    }

    const dirty = pickDirty(values, initial);
    if (Object.keys(dirty).length === 0) {
      onDone();
      return;
    }

    const payload: UpdateProfileRequest = {};
    if ("first_name" in dirty) payload.first_name = dirty.first_name;
    if ("last_name" in dirty) payload.last_name = dirty.last_name;
    if ("phone_number" in dirty) {
      payload.phone_number = dirty.phone_number ? dirty.phone_number : undefined;
    }
    if ("executive_title" in dirty) {
      payload.executive_title = dirty.executive_title
        ? (dirty.executive_title as UpdateProfileRequest["executive_title"])
        : null;
    }
    if ("engagement_type" in dirty) {
      payload.engagement_type =
        dirty.engagement_type as UpdateProfileRequest["engagement_type"];
    }
    if ("job_function_codes" in dirty) {
      payload.job_function_codes = dirty.job_function_codes;
    }
    if ("specialty_codes" in dirty) {
      payload.specialty_codes = dirty.specialty_codes;
    }

    try {
      await updateProfile(profile.staff_id, payload);
      toast.success(t("profile.updateSuccess"));
      onDone();
      const orgId = profile.organization.id;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: queryKeys.staff.byOrg(orgId) }),
      ]);
    } catch (error) {
      if (error instanceof ApiError && error.status === 400) {
        toast.error(t("profile.updateInvalid"));
      } else {
        toast.error(t("profile.updateError"));
      }
    }
  }

  return (
    <form className="grid gap-3" onSubmit={handleSubmit(onSubmit)}>
      <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
        {t("profile.sharedAcrossOrgs")}
      </p>

      <div className="grid gap-1">
        <FieldLabel htmlFor="settings-first-name" required>
          {t("fields.firstName")}
        </FieldLabel>
        <input
          id="settings-first-name"
          aria-required
          aria-invalid={!!errors.first_name}
          className={fieldClass(errors.first_name)}
          {...register("first_name")}
        />
      </div>

      <div className="grid gap-1">
        <FieldLabel htmlFor="settings-last-name" required>
          {t("fields.lastName")}
        </FieldLabel>
        <input
          id="settings-last-name"
          aria-required
          aria-invalid={!!errors.last_name}
          className={fieldClass(errors.last_name)}
          {...register("last_name")}
        />
      </div>

      <div className="grid gap-1">
        <FieldLabel htmlFor="settings-phone">{t("fields.phone")}</FieldLabel>
        <input
          id="settings-phone"
          inputMode="tel"
          className={fieldClass(errors.phone_number)}
          {...register("phone_number")}
        />
      </div>

      <div className="grid gap-1">
        <FieldLabel htmlFor="settings-executive-title">
          {t("fields.executiveTitle")}
        </FieldLabel>
        <select
          id="settings-executive-title"
          className={fieldClass(errors.executive_title)}
          {...register("executive_title")}
        >
          <option value="">{t("executiveTitles.NONE")}</option>
          {profileEnums?.executive_titles?.map((opt) => (
            <option key={opt.code} value={opt.code}>
              {opt.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-1">
        <FieldLabel htmlFor="settings-engagement-type" required>
          {t("fields.engagementType")}
        </FieldLabel>
        <select
          id="settings-engagement-type"
          className={fieldClass(errors.engagement_type)}
          {...register("engagement_type")}
        >
          {profileEnums?.engagement_types?.map((opt) => (
            <option key={opt.code} value={opt.code}>
              {opt.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-1">
        <FieldLabel htmlFor="settings-job-functions">
          {t("fields.jobFunctions")}
        </FieldLabel>
        <CodeMultiSelect
          value={jobFunctionCodes}
          onChange={(next) =>
            setValue("job_function_codes", next, { shouldDirty: true })
          }
          options={jobFunctionOptions}
          placeholder={
            jobFunctionsLookup.isLoading
              ? t("loading")
              : t("fields.jobFunctionsPlaceholder")
          }
          removeAriaLabel={(label) => t("fields.removeOption", { label })}
        />
      </div>

      <div className="grid gap-1">
        <FieldLabel htmlFor="settings-specialty-codes">
          {t("fields.specialties")}
        </FieldLabel>
        <CodeMultiSelect
          value={specialtyCodes}
          onChange={(next) =>
            setValue("specialty_codes", next, { shouldDirty: true })
          }
          options={specialtyOptions}
          placeholder={
            specialtiesLookup.isLoading
              ? t("loading")
              : t("fields.specialtiesPlaceholder")
          }
          removeAriaLabel={(label) => t("fields.removeOption", { label })}
        />
      </div>

      <DrawerActions cancelLabel={cancelLabel}>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-brand-primary text-white hover:bg-brand-primary/90"
        >
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {t("profile.save")}
        </Button>
      </DrawerActions>
    </form>
  );
}

export function OrganizationForm({
  cancelLabel,
  onDone,
  profile,
  t,
}: SettingsFormProps) {
  const specialtiesLookup = useSpecialtiesLookup();
  const specialtyOptions =
    specialtiesLookup.data?.data?.map((s) => ({ code: s.code, label: s.name })) ?? [];

  const initial = useMemo<OrganizationFormData>(
    () => ({
      name: profile?.organization.name ?? "",
      specialties: getOrganizationSpecialtyCodes(profile),
    }),
    [profile],
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationFormSchema),
    defaultValues: initial,
  });

  const specialties = watch("specialties");

  async function onSubmit(values: OrganizationFormData) {
    if (!profile?.organization.id) {
      toast.error(t("organization.updateError"));
      return;
    }
    const dirty = pickDirty(values, initial);
    if (Object.keys(dirty).length === 0) {
      onDone();
      return;
    }
    try {
      await updateOrganization(profile.organization.id, dirty);
      toast.success(t("organization.updateSuccess"));
      onDone();
      await queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY });
    } catch {
      toast.error(t("organization.updateError"));
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-1">
        <FieldLabel htmlFor="organization-name" required>
          {t("fields.organizationName")}
        </FieldLabel>
        <input
          id="organization-name"
          aria-required
          aria-invalid={!!errors.name}
          className={fieldClass(errors.name)}
          {...register("name")}
        />
      </div>
      <div className="grid gap-1">
        <FieldLabel htmlFor="organization-specialties">
          {t("fields.specialties")}
        </FieldLabel>
        <CodeMultiSelect
          value={specialties}
          onChange={(next) =>
            setValue("specialties", next, { shouldDirty: true })
          }
          options={specialtyOptions}
          placeholder={
            specialtiesLookup.isLoading
              ? t("loading")
              : t("fields.specialtiesPlaceholder")
          }
          removeAriaLabel={(label) => t("fields.removeOption", { label })}
        />
      </div>
      <DrawerActions cancelLabel={cancelLabel}>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-brand-primary text-white hover:bg-brand-primary/90"
        >
          {isSubmitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Pencil className="size-4" />
          )}
          {t("organization.save")}
        </Button>
      </DrawerActions>
    </form>
  );
}

export function BranchForm({
  activeDrawer,
  branches = [],
  branchId,
  cancelLabel,
  onDone,
  profile,
  t,
}: SettingsFormProps) {
  const isEdit = activeDrawer === "branchEdit";
  const targetBranch = isEdit
    ? (branches.find((b) => b.id === branchId) ?? branches[0])
    : undefined;

  const initial = useMemo<BranchFormData>(
    () => ({
      name: targetBranch?.name ?? "",
      address: targetBranch?.address ?? "",
      city: targetBranch?.city ?? "",
      governorate: targetBranch?.governorate ?? "",
      country: targetBranch?.country ?? "",
      is_main: targetBranch?.is_main ?? false,
    }),
    [targetBranch],
  );

  const [isMainTouched, setIsMainTouched] = useState(false);
  const onlyMain =
    isEdit &&
    targetBranch?.is_main === true &&
    branches.filter((b) => b.is_main).length <= 1;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BranchFormData>({
    resolver: zodResolver(branchFormSchema),
    defaultValues: initial,
  });

  async function onSubmit(values: BranchFormData) {
    if (!profile?.organization.id) {
      toast.error(isEdit ? t("branches.updateError") : t("branches.createError"));
      return;
    }

    const wantsToDemoteOnlyMain =
      isEdit && onlyMain && isMainTouched && values.is_main === false;
    if (wantsToDemoteOnlyMain) {
      toast.error(t("branches.cannotDemoteOnlyMain"));
      return;
    }

    try {
      if (isEdit) {
        if (!targetBranch?.id) {
          toast.error(t("branches.updateError"));
          return;
        }
        const patch: UpdateBranchRequest = {};
        if (values.name !== initial.name) patch.name = values.name;
        if (values.address !== initial.address) patch.address = values.address;
        if (values.city !== initial.city) patch.city = values.city;
        if (values.governorate !== initial.governorate)
          patch.governorate = values.governorate;
        if ((values.country || "") !== (initial.country || "")) {
          patch.country = values.country || undefined;
        }
        if (isMainTouched && values.is_main !== initial.is_main) {
          patch.is_main = values.is_main;
        }

        if (Object.keys(patch).length === 0) {
          onDone();
          return;
        }

        await updateBranch(profile.organization.id, targetBranch.id, patch);
        toast.success(t("branches.updateSuccess"));
      } else {
        const body: CreateBranchRequest = {
          name: values.name,
          address: values.address,
          city: values.city,
          governorate: values.governorate,
          country: values.country || undefined,
          ...(values.is_main ? { is_main: true } : {}),
        };
        await createBranch(profile.organization.id, body);
        toast.success(t("branches.createSuccess"));
      }

      onDone();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.settings.branches(profile.organization.id),
        }),
        queryClient.invalidateQueries({ queryKey: queryKeys.calendar.all() }),
      ]);
    } catch (error) {
      const limit = getSubscriptionLimit(error);
      if (limit?.resource === "branches") {
        toast.error(
          t("subscription.branchLimitReached", {
            current: limit.current,
            limit: limit.limit,
          }),
        );
      } else if (error instanceof ApiError && error.status === 400) {
        toast.error(t("branches.cannotDemoteOnlyMain"));
      } else {
        toast.error(
          isEdit ? t("branches.updateError") : t("branches.createError"),
        );
      }
    }
  }

  const currentMain = branches.find((b) => b.is_main && b.id !== targetBranch?.id);

  return (
    <form className="grid gap-3" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-1">
        <FieldLabel htmlFor="branch-name" required>
          {t("fields.name")}
        </FieldLabel>
        <input
          id="branch-name"
          aria-required
          aria-invalid={!!errors.name}
          className={fieldClass(errors.name)}
          {...register("name")}
        />
      </div>
      <div className="grid gap-1">
        <FieldLabel htmlFor="branch-country">{t("fields.country")}</FieldLabel>
        <input
          id="branch-country"
          className={fieldClass(errors.country)}
          {...register("country")}
        />
      </div>
      <div className="grid gap-1">
        <FieldLabel htmlFor="branch-city" required>
          {t("fields.city")}
        </FieldLabel>
        <input
          id="branch-city"
          aria-required
          aria-invalid={!!errors.city}
          className={fieldClass(errors.city)}
          {...register("city")}
        />
      </div>
      <div className="grid gap-1">
        <FieldLabel htmlFor="branch-governorate" required>
          {t("fields.governorate")}
        </FieldLabel>
        <input
          id="branch-governorate"
          aria-required
          aria-invalid={!!errors.governorate}
          className={fieldClass(errors.governorate)}
          {...register("governorate")}
        />
      </div>
      <div className="grid gap-1">
        <FieldLabel htmlFor="branch-address" required>
          {t("fields.address")}
        </FieldLabel>
        <input
          id="branch-address"
          aria-required
          aria-invalid={!!errors.address}
          className={fieldClass(errors.address)}
          {...register("address")}
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-brand-black">
        <input
          type="checkbox"
          className="size-4 rounded border-gray-300"
          {...register("is_main", {
            onChange: () => setIsMainTouched(true),
          })}
        />
        <span>{t("fields.mainBranch")}</span>
      </label>
      {isEdit && currentMain && (
        <p className="text-xs text-gray-500">
          {t("branches.demoteWarning", { name: currentMain.name })}
        </p>
      )}
      {onlyMain && (
        <p className="text-xs text-amber-700">
          {t("branches.onlyMainHint")}
        </p>
      )}
      <DrawerActions cancelLabel={cancelLabel}>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-brand-primary text-white hover:bg-brand-primary/90"
        >
          {isSubmitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : isEdit ? (
            <Pencil className="size-4" />
          ) : (
            <Plus className="size-4" />
          )}
          {isEdit ? t("branches.save") : t("branches.add")}
        </Button>
      </DrawerActions>
    </form>
  );
}
