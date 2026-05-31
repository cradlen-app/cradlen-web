"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { getActiveProfile } from "@/features/auth/lib/current-user";
import {
  canAccessBilling,
  isClinical,
} from "@/features/auth/lib/permissions";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { useUpdateVisitStatus } from "../../hooks/useUpdateVisitStatus";
import { useVisit } from "../../hooks/useVisit";
import { InvoiceDrawer } from "@/features/financial/components/InvoiceDrawer";
import { CompleteVisitDialog } from "../CompleteVisitDialog";
import { VisitWorkspaceHeader } from "./VisitWorkspaceHeader";
import { VisitContextRail } from "./overview/VisitContextRail";
import { ExaminationTab } from "./tabs/ExaminationTab";
import { HistoryTab } from "./tabs/HistoryTab";
import { OverviewTab } from "./tabs/OverviewTab";
import { useVisitJourney } from "@/features/journeys/lib/useVisitJourney";
import { JourneyClinicalTab } from "@/features/journeys/components/JourneyClinicalTab";

type Props = {
  visitId: string;
};

// Base tabs plus an optional dynamic `journey:<id>` tab for the active journey.
type TabValue = string;

export function VisitWorkspacePage({ visitId }: Props) {
  const t = useTranslations("visits.workspace");
  const tDetail = useTranslations("visits.detail");
  const { data: user } = useCurrentUser();
  const profile = getActiveProfile(user);
  const branchId = useAuthContextStore((s) => s.branchId);
  const organizationId = useAuthContextStore((s) => s.organizationId);

  const { data: visit, isLoading, isError } = useVisit(visitId);
  const { data: journey } = useVisitJourney(visitId);
  const updateStatus = useUpdateVisitStatus();
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [invoiceDrawerOpen, setInvoiceDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabValue>("overview");

  const handleNavigateToHistory = useCallback((sectionCode: string) => {
    setActiveTab("history");
    requestAnimationFrame(() => {
      document.getElementById(sectionCode)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, [setActiveTab]);

  const canComplete = isClinical(profile) && visit?.status === "IN_PROGRESS";
  const showInvoiceBtn = canAccessBilling(profile);

  // At most one dynamic tab — the active journey's clinical surface, when its
  // care path declares one. Absent → only the three base tabs render.
  const journeyTab = journey?.clinical_surface ? journey : null;
  const journeyTabValue = journeyTab ? `journey:${journeyTab.journey_id}` : null;

  // Completion requires a main complaint + provisional diagnosis; the dialog
  // loads the current values, validates, writes both, then completes.
  function handleComplete() {
    if (!visit) return;
    setCompleteDialogOpen(true);
  }

  if (isLoading) {
    return (
      <main className="space-y-6 p-6">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-100" />
        <div className="h-12 w-72 animate-pulse rounded bg-gray-100" />
        <div className="h-64 animate-pulse rounded-2xl bg-gray-50" />
      </main>
    );
  }

  if (isError || !visit || !organizationId || !branchId) {
    return (
      <main className="space-y-4 p-6">
        <p className="rounded-xl border border-red-100 bg-red-50/50 px-4 py-3 text-xs text-red-600">
          {tDetail("loadError")}
        </p>
      </main>
    );
  }

  return (
    <main className="flex h-full flex-col gap-6 overflow-hidden p-6">
      <VisitWorkspaceHeader
        visit={visit}
        organizationId={organizationId}
        branchId={branchId}
        canComplete={!!canComplete}
        isMutating={updateStatus.isPending}
        onComplete={handleComplete}
        showInvoice={showInvoiceBtn}
        onInvoice={() => setInvoiceDrawerOpen(true)}
      />

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(260px,320px)]">
        <Tabs
          value={activeTab}
          defaultValue="overview"
          onValueChange={(v) => setActiveTab(v as TabValue)}
          className="flex h-full min-h-0 flex-col"
        >
          <TabsList aria-label={t("tabsAria")}>
            <TabsTrigger value="overview">{t("tabs.overview")}</TabsTrigger>
            <TabsTrigger value="history">{t("tabs.history")}</TabsTrigger>
            <TabsTrigger value="examination">
              {t("tabs.examination")}
            </TabsTrigger>
            {journeyTab && journeyTabValue && (
              <TabsTrigger value={journeyTabValue}>
                {journeyTab.clinical_surface!.label}
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent
            value="overview"
            className="min-h-0 flex-1 overflow-hidden"
          >
            <OverviewTab visit={visit} />
          </TabsContent>
          <TabsContent
            value="history"
            className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden rounded-2xl border border-gray-100 bg-white shadow-sm p-6"
          >
            <HistoryTab
              patientId={visit.patient.id}
              specialtyCode={visit.specialtyCode ?? null}
            />
          </TabsContent>
          <TabsContent
            value="examination"
            className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-gray-100 bg-white shadow-sm p-6"
          >
            <ExaminationTab visit={visit} />
          </TabsContent>
          {journeyTab && journeyTabValue && (
            <TabsContent
              value={journeyTabValue}
              className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-gray-100 bg-white shadow-sm p-6"
            >
              <JourneyClinicalTab visitId={visit.id} descriptor={journeyTab} />
            </TabsContent>
          )}
        </Tabs>

        <VisitContextRail
          patientId={visit.patient.id}
          onNavigateToHistory={handleNavigateToHistory}
        />
      </div>

      <CompleteVisitDialog
        open={completeDialogOpen}
        onOpenChange={setCompleteDialogOpen}
        visit={visit}
        onCompleted={() => toast.success(tDetail("completedToast"))}
      />

      <InvoiceDrawer
        open={invoiceDrawerOpen}
        onOpenChange={setInvoiceDrawerOpen}
        prefill={{
          visitId: visit.id,
          patientId: visit.patient.id,
          doctorId: visit.assignedDoctorId,
        }}
      />
    </main>
  );
}
