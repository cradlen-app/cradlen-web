"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronLeft, Loader2 } from "lucide-react";
import { ApiError } from "@/infrastructure/http/api";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchFormTemplate } from "@/builder/templates/templates.api";
import { queryKeys } from "@/lib/queryKeys";
import { TemplateExecutionContextProvider } from "@/builder/runtime/TemplateExecutionContext";
import { toInitialFormState } from "@/builder/templates/initial-values";
import {
  usePatchVisitExamination,
  useVisitExamination,
} from "@/features/examination/api/useVisitExamination";
import { VisitExaminationFormShell } from "@/features/examination/components/VisitExaminationFormShell";
import { useUpdateMedRepVisitStatus } from "@/features/visits/hooks/useUpdateMedRepVisitStatus";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { getActiveProfile } from "@/features/auth/lib/current-user";
import { canOpenMedicalRepOverview } from "@/features/auth/lib/permissions";
import { useOrgSpecialties } from "@/features/settings/hooks/useOrgSpecialties";
import {
  ProductsDiscussed,
  type SelectedMedication,
} from "./ProductsDiscussed";
import { RepSummaryCard } from "./RepSummaryCard";
import { RepVisitsHistoryList } from "./RepVisitsHistoryList";

const TEMPLATE_CODE = "medical_rep_visit";

/** Status chain for the rep visit queue; "Complete Visit" walks it to COMPLETED. */
const STATUS_CHAIN = [
  "SCHEDULED",
  "CHECKED_IN",
  "IN_PROGRESS",
  "COMPLETED",
] as const;

type RepStatus = (typeof STATUS_CHAIN)[number] | "CANCELLED" | "NO_SHOW";

interface RepExamOverview {
  full_name: string;
  company_name: string;
  phone_number: string | null;
  specialty_focus: string | null;
  last_visit_at: string | null;
  promoted_medications: string[];
}

interface RepExamEnvelope {
  visit_id: string;
  medical_rep_id: string;
  examination_version: number;
  status: RepStatus;
  overview: RepExamOverview;
  discussed_medications: { id: string; name: string }[];
  [key: string]: unknown;
}

interface Props {
  visitId: string;
}

function isNotFound(err: unknown): boolean {
  return err instanceof ApiError && err.status === 404;
}

export function MedicalRepVisitPage({ visitId }: Props) {
  const t = useTranslations("medicalRep.visit");
  const tExam = useTranslations("examination.workspace");
  const organizationId = useAuthContextStore((s) => s.organizationId);
  const branchId = useAuthContextStore((s) => s.branchId);
  const { data: currentUser, isLoading: isUserLoading } = useCurrentUser();
  const canOpen = canOpenMedicalRepOverview(getActiveProfile(currentUser));
  const endpointPath = `/medical-rep-visits/${visitId}/examination`;

  const templateQuery = useQuery({
    queryKey: queryKeys.formTemplates.byCode(TEMPLATE_CODE, null),
    queryFn: () => fetchFormTemplate(TEMPLATE_CODE),
    staleTime: Infinity,
    retry: (failureCount, error) =>
      isNotFound(error) ? false : failureCount < 2,
  });

  const dataQuery = useVisitExamination(endpointPath);
  const patchMut = usePatchVisitExamination(endpointPath);
  const statusMut = useUpdateMedRepVisitStatus();
  const { data: specialties } = useOrgSpecialties(organizationId);

  const envelope = (dataQuery.data ?? null) as RepExamEnvelope | null;

  // "Products discussed" selection (lifted out of the template — bespoke picker).
  // Re-synced from the server whenever the envelope (re)loads or version bumps.
  const [selectedMeds, setSelectedMeds] = useState<SelectedMedication[]>([]);
  const examVersion = envelope?.examination_version;
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (envelope) setSelectedMeds(envelope.discussed_medications ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [envelope?.visit_id, examVersion]);

  const base =
    organizationId && branchId
      ? `/${organizationId}/${branchId}/dashboard`
      : "/dashboard";
  const dashboardHref = base;
  const repsHref = `${base}/medical-rep`;

  const isClosed = useMemo(
    () =>
      envelope != null &&
      ["COMPLETED", "CANCELLED", "NO_SHOW"].includes(envelope.status),
    [envelope],
  );

  if (!isUserLoading && !canOpen) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-sm text-gray-400">
        {t("forbidden")}
      </div>
    );
  }
  if (isNotFound(templateQuery.error) || isNotFound(dataQuery.error)) {
    return <div className="p-6 text-sm text-gray-500">{t("loadError")}</div>;
  }
  if (templateQuery.isLoading || dataQuery.isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-12 text-xs text-gray-400">
        <Loader2 className="mr-2 animate-spin" size={14} />
        {t("loading")}
      </div>
    );
  }
  if (!templateQuery.data || !envelope) {
    return <div className="p-6 text-sm text-red-500">{t("loadError")}</div>;
  }

  const template = templateQuery.data;
  const initial = toInitialFormState(envelope, template);
  const { overview } = envelope;

  /** Walk the status chain from the current state to COMPLETED. */
  async function completeVisit() {
    if (!envelope) return;
    const fromIdx = STATUS_CHAIN.indexOf(
      envelope.status as (typeof STATUS_CHAIN)[number],
    );
    if (fromIdx < 0) return; // CANCELLED / NO_SHOW — not completable
    try {
      for (let i = fromIdx + 1; i < STATUS_CHAIN.length; i++) {
        await statusMut.mutateAsync({ visitId, status: STATUS_CHAIN[i] });
      }
      await dataQuery.refetch();
      toast.success(t("completedToast"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("completeError"));
    }
  }

  return (
    <main className="flex h-full flex-col gap-5 overflow-hidden p-6">
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Link
              href={dashboardHref}
              aria-label={t("backToVisits")}
              className="inline-flex size-7 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-brand-black"
            >
              <ChevronLeft className="size-5 rtl:rotate-180" aria-hidden />
            </Link>
            <h1 className="text-lg font-semibold text-brand-black">
              {t("title")}
            </h1>
          </div>
          <Breadcrumbs
            ariaLabel={t("breadcrumbAria")}
            items={[
              { label: t("crumbMedicalReps"), href: repsHref },
              {
                label: overview.full_name,
                href: `${repsHref}/rep/${envelope.medical_rep_id}`,
              },
              { label: t("crumbVisitCurrent") },
            ]}
          />
        </div>
        {!isClosed ? (
          <Button
            onClick={() => void completeVisit()}
            disabled={statusMut.isPending}
            className="bg-brand-primary"
          >
            {statusMut.isPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : null}
            <span className="ml-2">{t("complete")}</span>
          </Button>
        ) : (
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500">
            {t(`status.${envelope.status}`)}
          </span>
        )}
      </header>

      <Tabs
        defaultValue="overview"
        className="flex min-h-0 flex-1 flex-col gap-1"
      >
        <TabsList aria-label={t("tabsAria")}>
          <TabsTrigger value="overview">{t("tabs.overview")}</TabsTrigger>
          <TabsTrigger value="visit">{t("tabs.visit")}</TabsTrigger>
        </TabsList>

        {/* Overview: one card — rep profile card + visits-history timeline */}
        <TabsContent
          value="overview"
          className="min-h-0 flex-1 overflow-hidden"
        >
          <section className="h-full overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="grid h-full grid-cols-1 md:grid-cols-[320px_minmax(0,1fr)] md:divide-x md:divide-gray-100 rtl:md:divide-x-reverse">
              <RepSummaryCard overview={overview} specialties={specialties} />
              <div className="flex h-full flex-col gap-6 overflow-y-auto p-5">
                <RepVisitsHistoryList source={{ visitId }} />
              </div>
            </div>
          </section>
        </TabsContent>

        {/* Visit: one card — editable form + products-discussed rail */}
        <TabsContent value="visit" className="min-h-0 flex-1 overflow-hidden">
          <section className="h-full overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="grid h-full grid-cols-1 md:grid-cols-[minmax(0,1fr)_320px] md:divide-x md:divide-gray-100 rtl:md:divide-x-reverse">
              <div className="flex h-full min-h-0 flex-col p-5">
                <TemplateExecutionContextProvider
                  key={envelope.examination_version}
                  template={template}
                  initialFormValues={initial.formValues}
                  initialSearchState={initial.searchState}
                  initialRepeatableRows={initial.repeatableRows}
                >
                  <VisitExaminationFormShell
                    template={template}
                    patientId={visitId}
                    specialtyCode={null}
                    readOnly={isClosed}
                    saving={patchMut.isPending || dataQuery.isFetching}
                    onSave={async (body) => {
                      if (isClosed) return;
                      // "Products discussed" lives outside the template — fold
                      // the bespoke picker selection into the same PATCH body.
                      const merged = {
                        ...body,
                        products: selectedMeds.map((m) => ({
                          medication_id: m.id,
                          name: m.name,
                        })),
                      };
                      try {
                        await patchMut.mutateAsync({ body: merged });
                        toast.success(tExam("saved"));
                      } catch (err) {
                        toast.error(
                          err instanceof Error
                            ? err.message
                            : tExam("saveError"),
                        );
                        throw err;
                      }
                    }}
                  />
                </TemplateExecutionContextProvider>
              </div>

              <div className="h-full overflow-y-auto p-5">
                <ProductsDiscussed
                  value={selectedMeds}
                  onChange={setSelectedMeds}
                  disabled={isClosed}
                />
              </div>
            </div>
          </section>
        </TabsContent>
      </Tabs>
    </main>
  );
}
