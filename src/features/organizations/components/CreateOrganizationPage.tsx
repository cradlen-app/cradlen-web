"use client";

import { useEffect, useMemo } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import type { UseFormRegisterReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, GitBranch, Loader2, UserCog } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { cn } from "@/common/utils/utils";
import { Button } from "@/components/ui/button";
import { Link, useRouter } from "@/i18n/navigation";
import { SpecialtiesSelect } from "@/components/common/SpecialtiesSelect";
import { SubspecialtiesSelect } from "@/components/common/SubspecialtiesSelect";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSpecialtiesLookup } from "@/features/settings/hooks/useSettingsLookups";
import { EXECUTIVE_TITLE, JOB_ROLE } from "@/features/auth/lib/auth.constants";
import { makeStep3Schema } from "@/features/auth/lib/sign-up.schemas";
import { buildRegisterOrganizationRequest } from "@/features/auth/lib/register-organization";
import type { Step3Data } from "@/features/auth/types/sign-up.types";
import { setPendingProfileSelection } from "@/features/auth/lib/profile-selection-session";
import { useAvailableProfilesStore } from "@/features/auth/store/availableProfilesStore";
import { getProfilesFromAuthResponse } from "@/lib/auth/redirect";
import { createOrganizationSession } from "@/features/settings/lib/settings.api";
import { getSubscriptionLimit } from "@/common/errors/subscription-errors";

const inputClass =
  "h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm text-brand-black outline-none transition focus:border-brand-primary/60 focus:ring-2 focus:ring-brand-primary/10";

const errorInputClass =
  "border-red-400 focus:border-red-400 focus:ring-red-400/20";

function FieldGroup({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary">
          {icon}
        </span>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          {title}
        </p>
      </div>
      <div className="grid gap-3">{children}</div>
    </div>
  );
}

function TextField({
  id,
  label,
  placeholder,
  required,
  error,
  registration,
}: {
  id: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  registration: UseFormRegisterReturn;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm text-brand-black" htmlFor={id}>
      <span className="font-medium">
        {label}
        {required && <span className="ms-0.5 text-brand-primary">*</span>}
      </span>
      <input
        id={id}
        placeholder={placeholder}
        aria-required={required}
        className={cn(inputClass, error && errorInputClass)}
        {...registration}
      />
      {error && <span className="text-xs text-red-500">{error}</span>}
    </label>
  );
}

export function CreateOrganizationPage() {
  const t = useTranslations("createOrganization");
  // The role/specialty/title block mirrors signup step 3 — reuse its schema and
  // label/option strings rather than duplicating them here.
  const tAuth = useTranslations("auth.signUp");
  const schema = useMemo(() => makeStep3Schema(tAuth), [tAuth]);
  const router = useRouter();

  const form = useForm<Step3Data>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      organizationName: "",
      specialties: [],
      executiveTitle: EXECUTIVE_TITLE.CEO,
      jobRole: JOB_ROLE.NONE,
      doctorSpecialty: "",
      doctorSubspecialties: [],
      professionalTitle: "",
      city: "",
      address: "",
      governorate: "",
      country: "",
      branchName: "",
    },
  });

  const { register, control, setValue, formState } = form;
  const { errors, isValid, isSubmitting } = formState;

  const jobRole = useWatch({ control, name: "jobRole" });
  const isDoctor = jobRole === JOB_ROLE.DOCTOR;
  const setAvailableProfiles = useAvailableProfilesStore(
    (state) => state.setAvailableProfiles,
  );
  const specialtyLookup = useSpecialtiesLookup();
  const specialtyOptions = useMemo(
    () => specialtyLookup.data?.data ?? [],
    [specialtyLookup.data],
  );

  const selectedSpecialty = useWatch({ control, name: "doctorSpecialty" });
  const subspecialtyOptions = useMemo(
    () =>
      specialtyOptions.find((s) => s.code === selectedSpecialty)
        ?.subspecialties ?? [],
    [specialtyOptions, selectedSpecialty],
  );
  // Clear any subspecialties when the parent specialty changes — stale codes
  // would fail the server's parent-consistency check.
  useEffect(() => {
    setValue("doctorSubspecialties", []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSpecialty]);

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      const res = await createOrganizationSession(
        buildRegisterOrganizationRequest(data),
      );
      // Seed the select-profile screen with the refreshed list (including the
      // org just created) so it renders immediately instead of the empty state.
      const profiles = getProfilesFromAuthResponse(res);
      if (profiles.length > 0) {
        setPendingProfileSelection({ profiles });
        setAvailableProfiles(profiles);
      }
      toast.success(t("createSuccess"));
      router.replace("/select-profile");
    } catch (error) {
      const limit = getSubscriptionLimit(error);
      if (limit?.resource === "organizations") {
        toast.error(
          t("organizationLimitReached", {
            current: limit.current,
            limit: limit.limit,
          }),
        );
      } else {
        toast.error(t("createError"));
      }
    }
  });

  return (
    <div className="w-full">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold text-brand-black">{t("title")}</h1>
        <p className="mt-1.5 text-sm text-gray-400">{t("subtitle")}</p>
      </div>

      <form className="grid gap-4" onSubmit={handleSubmit}>
        <FieldGroup icon={<Building2 className="size-4" />} title={t("groupOrganization")}>
          <TextField
            id="org-name"
            label={t("fields.organizationName")}
            required
            error={errors.organizationName?.message}
            registration={register("organizationName")}
          />
          <label className="flex flex-col gap-1.5 text-sm text-brand-black">
            <span className="font-medium">
              {t("fields.specialties")}
              <span className="ms-0.5 text-brand-primary">*</span>
            </span>
            <Controller
              control={control}
              name="specialties"
              render={({ field }) => (
                <SpecialtiesSelect
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t("fields.specialtiesPlaceholder")}
                  hasError={!!errors.specialties}
                />
              )}
            />
            {errors.specialties && (
              <span className="text-xs text-red-500">
                {errors.specialties.message as string | undefined}
              </span>
            )}
          </label>
        </FieldGroup>

        <FieldGroup icon={<UserCog className="size-4" />} title={t("groupRole")}>
          <label className="flex flex-col gap-1.5 text-sm text-brand-black">
            <span className="font-medium">{tAuth("executiveTitleLabel")}</span>
            <Controller
              control={control}
              name="executiveTitle"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className={cn(inputClass, "h-auto w-full")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(EXECUTIVE_TITLE).map((title) => (
                      <SelectItem key={title} value={title}>
                        {tAuth(`executiveTitles.${title}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm text-brand-black">
            <span className="font-medium">{tAuth("jobRoleLabel")}</span>
            <Controller
              control={control}
              name="jobRole"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className={cn(inputClass, "h-auto w-full")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(JOB_ROLE).map((role) => (
                      <SelectItem key={role} value={role}>
                        {tAuth(`jobRoles.${role}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </label>

          {isDoctor && (
            <div className="flex flex-col gap-3 ps-1">
              <label className="flex flex-col gap-1.5 text-sm text-brand-black">
                <span className="font-medium">
                  {tAuth("doctorSpecialtyLabel")}
                </span>
                <Controller
                  control={control}
                  name="doctorSpecialty"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger
                        className={cn(
                          inputClass,
                          "h-auto w-full",
                          errors.doctorSpecialty && errorInputClass,
                        )}
                      >
                        <SelectValue
                          placeholder={tAuth("doctorSpecialtyPlaceholder")}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {specialtyOptions.map(({ code, name }) => (
                          <SelectItem key={code} value={code}>
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.doctorSpecialty && (
                  <span className="text-xs text-red-500">
                    {errors.doctorSpecialty.message}
                  </span>
                )}
              </label>

              {subspecialtyOptions.length > 0 && (
                <label className="flex flex-col gap-1.5 text-sm text-brand-black">
                  <span className="font-medium">
                    {tAuth("doctorSubspecialtyLabel")}
                  </span>
                  <Controller
                    control={control}
                    name="doctorSubspecialties"
                    render={({ field }) => (
                      <SubspecialtiesSelect
                        options={subspecialtyOptions}
                        value={field.value}
                        onChange={field.onChange}
                        disabled={!selectedSpecialty}
                        placeholder={tAuth("doctorSubspecialtyPlaceholder")}
                      />
                    )}
                  />
                </label>
              )}

              <TextField
                id="professionalTitle"
                label={tAuth("professionalTitleLabel")}
                placeholder={tAuth("professionalTitlePlaceholder")}
                error={errors.professionalTitle?.message}
                registration={register("professionalTitle")}
              />
              <p className="-mt-1 text-xs text-gray-400">
                {tAuth("professionalTitleHint")}
              </p>
            </div>
          )}
        </FieldGroup>

        <FieldGroup icon={<GitBranch className="size-4" />} title={t("groupBranch")}>
          <TextField
            id="branch-name"
            label={t("fields.branchName")}
            required
            error={errors.branchName?.message}
            registration={register("branchName")}
          />
          <div className="grid grid-cols-2 gap-3">
            <TextField
              id="branch-city"
              label={t("fields.city")}
              required
              error={errors.city?.message}
              registration={register("city")}
            />
            <TextField
              id="branch-governorate"
              label={t("fields.governorate")}
              required
              error={errors.governorate?.message}
              registration={register("governorate")}
            />
          </div>
          <TextField
            id="branch-address"
            label={t("fields.address")}
            required
            error={errors.address?.message}
            registration={register("address")}
          />
          <TextField
            id="branch-country"
            label={t("fields.country")}
            registration={register("country")}
          />
        </FieldGroup>

        <div className="flex flex-col gap-3 pt-1">
          <Button
            type="submit"
            disabled={isSubmitting || !isValid}
            className="h-11 w-full rounded-full bg-brand-primary text-sm font-semibold text-white hover:bg-brand-primary/90 disabled:opacity-60"
          >
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            {isSubmitting ? "" : t("submit")}
          </Button>
          <Link
            href="/select-profile"
            className="text-center text-sm text-gray-400 hover:text-brand-black transition"
          >
            {t("backToProfiles")}
          </Link>
        </div>
      </form>
    </div>
  );
}
