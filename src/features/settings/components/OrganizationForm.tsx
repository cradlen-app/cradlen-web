"use client";

import { useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CURRENT_USER_QUERY_KEY } from "@/features/auth/hooks/useCurrentUser";
import { queryClient } from "@/infrastructure/query/queryClient";
import { updateOrganization } from "../lib/settings.api";
import {
  organizationFormSchema,
  type OrganizationFormData,
} from "../lib/settings.schemas";
import { useSpecialtiesLookup } from "../hooks/useSettingsLookups";
import { CodeMultiSelect } from "./CodeMultiSelect";
import { pickDirty } from "./settings.utils";
import { DrawerActions } from "./settings-ui";
import {
  FieldLabel,
  fieldClass,
  getOrganizationSpecialtyCodes,
  type SettingsFormProps,
} from "./settings-form-shared";

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
    control,
    formState: { errors, isSubmitting },
  } = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationFormSchema),
    defaultValues: initial,
  });

  const specialties = useWatch({ control, name: "specialties" });

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
