"use client";

import { type FormEvent, useState } from "react";
import { Building2, GitBranch, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Link, useRouter } from "@/i18n/navigation";
import { SpecialtiesSelect } from "@/components/common/SpecialtiesSelect";
import { createOrganizationSession } from "@/features/settings/lib/settings.api";
import {
  getFormString,
  hasRequiredValues,
} from "@/features/settings/components/settings.utils";
import { getSubscriptionLimit } from "@/common/errors/subscription-errors";

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

function Field({
  id,
  label,
  name,
  placeholder,
  required,
}: {
  id: string;
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm text-brand-black" htmlFor={id}>
      <span className="font-medium">
        {label}
        {required && <span className="ms-0.5 text-brand-primary">*</span>}
      </span>
      <input
        id={id}
        name={name}
        placeholder={placeholder}
        aria-required={required}
        className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm text-brand-black outline-none transition focus:border-brand-primary/60 focus:ring-2 focus:ring-brand-primary/10"
      />
    </label>
  );
}

export function CreateOrganizationPage() {
  const t = useTranslations("createOrganization");
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [specialties, setSpecialties] = useState<string[]>([]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;

    if (
      !hasRequiredValues(form, [
        "organizationName",
        "branchName",
        "city",
        "governorate",
        "address",
      ])
    ) {
      toast.error(t("validationError"));
      return;
    }

    if (!specialties.length) {
      toast.error(t("validationError"));
      return;
    }

    setIsPending(true);
    try {
      await createOrganizationSession({
        organization_name: getFormString(form, "organizationName"),
        branch_name: getFormString(form, "branchName"),
        specialties,
        branch_city: getFormString(form, "city"),
        branch_governorate: getFormString(form, "governorate"),
        branch_address: getFormString(form, "address"),
        branch_country: getFormString(form, "country") || undefined,
      });

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
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="w-full">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold text-brand-black">{t("title")}</h1>
        <p className="mt-1.5 text-sm text-gray-400">{t("subtitle")}</p>
      </div>

      <form className="grid gap-4" onSubmit={handleSubmit}>
        <FieldGroup icon={<Building2 className="size-4" />} title={t("groupOrganization")}>
          <Field
            id="org-name"
            label={t("fields.organizationName")}
            name="organizationName"
            required
          />
          <label className="flex flex-col gap-1.5 text-sm text-brand-black">
            <span className="font-medium">
              {t("fields.specialties")}
              <span className="ms-0.5 text-brand-primary">*</span>
            </span>
            <SpecialtiesSelect
              value={specialties}
              onChange={setSpecialties}
              placeholder={t("fields.specialtiesPlaceholder")}
            />
          </label>
        </FieldGroup>

        <FieldGroup icon={<GitBranch className="size-4" />} title={t("groupBranch")}>
          <Field
            id="branch-name"
            label={t("fields.branchName")}
            name="branchName"
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Field
              id="branch-city"
              label={t("fields.city")}
              name="city"
              required
            />
            <Field
              id="branch-governorate"
              label={t("fields.governorate")}
              name="governorate"
              required
            />
          </div>
          <Field
            id="branch-address"
            label={t("fields.address")}
            name="address"
            required
          />
          <Field
            id="branch-country"
            label={t("fields.country")}
            name="country"
          />
        </FieldGroup>

        <div className="flex flex-col gap-3 pt-1">
          <Button
            type="submit"
            disabled={isPending}
            className="h-11 w-full rounded-full bg-brand-primary text-sm font-semibold text-white hover:bg-brand-primary/90 disabled:opacity-60"
          >
            {isPending && <Loader2 className="size-4 animate-spin" />}
            {isPending ? "" : t("submit")}
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
