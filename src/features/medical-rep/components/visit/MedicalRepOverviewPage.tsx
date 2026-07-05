"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { ApiError } from "@/infrastructure/http/api";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { getActiveProfile } from "@/features/auth/lib/current-user";
import { canOpenMedicalRepWorkspace } from "@/features/auth/lib/permissions";
import { useOrgSpecialties } from "@/features/settings/hooks/useOrgSpecialties";
import {
  fetchMedicalRep,
  fetchMedicalRepMedications,
} from "../../lib/medical-rep.api";
import { RepSummaryCard, type RepOverview } from "./RepSummaryCard";
import { RepVisitsHistoryList } from "./RepVisitsHistoryList";

interface Props {
  repId: string;
}

function isNotFound(err: unknown): boolean {
  return err instanceof ApiError && err.status === 404;
}

export function MedicalRepOverviewPage({ repId }: Props) {
  const t = useTranslations("medicalRep.visit");
  const organizationId = useAuthContextStore((s) => s.organizationId);
  const branchId = useAuthContextStore((s) => s.branchId);
  const { data: currentUser, isLoading: isUserLoading } = useCurrentUser();
  const canOpen = canOpenMedicalRepWorkspace(getActiveProfile(currentUser));
  const { data: specialties } = useOrgSpecialties(organizationId);

  const repQuery = useQuery({
    queryKey: ["medical-reps", "detail", repId],
    queryFn: () => fetchMedicalRep(repId),
    staleTime: 30_000,
    retry: (failureCount, error) =>
      isNotFound(error) ? false : failureCount < 2,
  });

  const medsQuery = useQuery({
    queryKey: ["medical-reps", "medications", repId],
    queryFn: () => fetchMedicalRepMedications(repId),
    staleTime: 30_000,
  });

  const repsHref =
    organizationId && branchId
      ? `/${organizationId}/${branchId}/dashboard/medical-rep`
      : "/dashboard/medical-rep";

  if (!isUserLoading && !canOpen) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-sm text-gray-400">
        {t("forbidden")}
      </div>
    );
  }
  if (isNotFound(repQuery.error)) {
    return <div className="p-6 text-sm text-gray-500">{t("loadError")}</div>;
  }
  if (repQuery.isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-12 text-xs text-gray-400">
        <Loader2 className="mr-2 animate-spin" size={14} />
        {t("loading")}
      </div>
    );
  }
  if (!repQuery.data) {
    return <div className="p-6 text-sm text-red-500">{t("loadError")}</div>;
  }

  const rep = repQuery.data.data;
  const overview: RepOverview = {
    full_name: rep.full_name,
    company_name: rep.company_name,
    phone_number: rep.phone_number,
    specialty_focus: rep.specialty_focus,
    last_visit_at: null,
    promoted_medications: (medsQuery.data?.data ?? []).map((m) => m.name),
  };

  return (
    <main className="flex h-full flex-col gap-5 overflow-hidden p-6">
      <header className="flex flex-col gap-1">
        <Breadcrumbs
          items={[
            { label: t("crumbMedicalReps"), href: repsHref },
            { label: rep.full_name },
          ]}
        />
        <h1 className="text-lg font-semibold text-brand-black">
          {rep.full_name}
        </h1>
      </header>

      {/* One card — rep profile card + visits-history timeline */}
      <section className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="grid h-full grid-cols-1 md:grid-cols-[320px_minmax(0,1fr)] md:divide-x md:divide-gray-100 rtl:md:divide-x-reverse">
          <RepSummaryCard overview={overview} specialties={specialties} />
          <div className="flex h-full flex-col gap-6 overflow-y-auto p-5">
            <RepVisitsHistoryList source={{ repId }} />
          </div>
        </div>
      </section>
    </main>
  );
}
