"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { EXECUTIVE_TITLE, JOB_ROLE } from "@/features/auth/lib/auth.constants";
import { makeStep3Schema } from "@/features/auth/lib/sign-up.schemas";
import { buildRegisterOrganizationRequest } from "@/features/auth/lib/register-organization";
import type { Step3Data } from "@/features/auth/types/sign-up.types";
import { setPendingProfileSelection } from "@/features/auth/lib/profile-selection-session";
import { useAvailableProfilesStore } from "@/features/auth/store/availableProfilesStore";
import { getProfilesFromAuthResponse } from "@/lib/auth/redirect";
import { createOrganizationSession } from "@/features/settings/lib/settings.api";
import { getSubscriptionLimit } from "@/common/errors/subscription-errors";
import {
  BranchSection,
  OrgInfoSection,
  RoleSection,
} from "./create-org-fields";

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

  const { isValid, isSubmitting } = form.formState;
  const setAvailableProfiles = useAvailableProfilesStore(
    (state) => state.setAvailableProfiles,
  );

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
        <OrgInfoSection form={form} />
        <RoleSection form={form} />
        <BranchSection form={form} />

        <div className="flex flex-col gap-3 pt-1">
          <Button
            type="submit"
            disabled={isSubmitting || !isValid}
            className="h-11 w-full rounded-full bg-brand-primary text-sm font-semibold text-white hover:bg-brand-primary/90 disabled:opacity-60"
          >
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            {isSubmitting ? "" : t("submit")}
          </Button>
        </div>
      </form>
    </div>
  );
}
