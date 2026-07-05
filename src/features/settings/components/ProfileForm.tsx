"use client";

import { useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CURRENT_USER_QUERY_KEY } from "@/features/auth/hooks/useCurrentUser";
import { ApiError } from "@/infrastructure/http/api";
import { queryClient } from "@/infrastructure/query/queryClient";
import { staffQueryKeys } from "@/core/staff/api";
import { isClinical } from "@/features/auth/lib/permissions";
import {
  updateProfile,
  type UpdateProfileRequest,
} from "../lib/settings.api";
import {
  profileFormSchema,
  type ProfileFormData,
} from "../lib/settings.schemas";
import { DateOfBirthPicker } from "@/features/auth/components/DateOfBirthPicker";
import { pickDirty } from "./settings.utils";
import { DrawerActions } from "./settings-ui";
import {
  FieldLabel,
  fieldClass,
  type SettingsFormProps,
} from "./settings-form-shared";

export function ProfileForm({
  cancelLabel,
  onDone,
  profile,
  t,
  user,
}: SettingsFormProps) {
  const showProfessionalTitle = isClinical(profile);

  const initial = useMemo<ProfileFormData>(
    () => ({
      first_name: user.first_name ?? "",
      last_name: user.last_name ?? "",
      phone_number: user.phone_number ?? user.phone ?? "",
      date_of_birth: user.date_of_birth?.slice(0, 10) ?? "",
      professional_title: profile?.professional_title ?? "",
    }),
    [user, profile],
  );

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: initial,
  });

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
    if ("date_of_birth" in dirty) {
      payload.date_of_birth = dirty.date_of_birth ? dirty.date_of_birth : null;
    }
    if (showProfessionalTitle && "professional_title" in dirty) {
      payload.professional_title = dirty.professional_title
        ? dirty.professional_title
        : null;
    }

    try {
      await updateProfile(profile.staff_id, payload);
      toast.success(t("profile.updateSuccess"));
      onDone();
      const orgId = profile.organization.id;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: staffQueryKeys.byOrg(orgId) }),
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

      <Controller
        control={control}
        name="date_of_birth"
        render={({ field }) => (
          <DateOfBirthPicker
            id="settings-date-of-birth"
            label={t("fields.dateOfBirth")}
            placeholder={t("fields.dateOfBirthPlaceholder")}
            value={field.value ?? ""}
            onChange={field.onChange}
            error={errors.date_of_birth?.message}
            inputClassName={fieldClass(errors.date_of_birth)}
          />
        )}
      />

      {showProfessionalTitle && (
        <div className="grid gap-1">
          <FieldLabel htmlFor="settings-professional-title">
            {t("fields.professionalTitle")}
          </FieldLabel>
          <input
            id="settings-professional-title"
            className={fieldClass(errors.professional_title)}
            placeholder={t("fields.professionalTitlePlaceholder")}
            {...register("professional_title")}
          />
          <p className="text-[11px] text-gray-400">
            {t("fields.professionalTitleHint")}
          </p>
        </div>
      )}

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
