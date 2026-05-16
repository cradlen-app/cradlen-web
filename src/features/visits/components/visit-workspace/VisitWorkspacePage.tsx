"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { getActiveProfile } from "@/features/auth/lib/current-user";
import {
  isClinical,
  showsBranchAggregate,
} from "@/features/auth/lib/permissions";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { getApiErrorMessage } from "@/common/errors/error";
import { useUpdateVisitStatus } from "../../hooks/useUpdateVisitStatus";
import { useVisit } from "../../hooks/useVisit";
import { CompleteVisitDialog } from "../CompleteVisitDialog";
import { VisitWorkspaceHeader } from "./VisitWorkspaceHeader";
import { ExaminationTab } from "./tabs/ExaminationTab";
import { HistoryTab } from "./tabs/HistoryTab";
import { OverviewTab } from "./tabs/OverviewTab";

type Props = {
  visitId: string;
};

type TabValue = "overview" | "history" | "examination";

const TERMINAL_STATUSES = new Set(["COMPLETED", "CANCELLED", "NO_SHOW"]);

export function VisitWorkspacePage({ visitId }: Props) {
  const t = useTranslations("visits.workspace");
  const tDetail = useTranslations("visits.detail");
  const { data: user } = useCurrentUser();
  const profile = getActiveProfile(user);
  const branchId = useAuthContextStore((s) => s.branchId);
  const organizationId = useAuthContextStore((s) => s.organizationId);

  const { data: visit, isLoading, isError } = useVisit(visitId);
  const updateStatus = useUpdateVisitStatus();
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabValue>("overview");

  const canComplete = isClinical(profile) && visit?.status === "IN_PROGRESS";
  const canCancel =
    !!visit &&
    showsBranchAggregate(profile) &&
    !TERMINAL_STATUSES.has(visit.status);

  async function handleComplete() {
    if (!visit) return;
    if (!visit.chiefComplaint?.trim()) {
      setCompleteDialogOpen(true);
      return;
    }
    try {
      await updateStatus.mutateAsync({
        visitId: visit.id,
        status: "COMPLETED",
        branchId: visit.branchId,
      });
      toast.success(tDetail("completedToast"));
    } catch (error) {
      toast.error(getApiErrorMessage(error, tDetail("actionError")));
    }
  }

  async function handleCancel() {
    if (!visit) return;
    try {
      await updateStatus.mutateAsync({
        visitId: visit.id,
        status: "CANCELLED",
        branchId: visit.branchId,
      });
      toast.success(tDetail("cancelledToast"));
    } catch (error) {
      toast.error(getApiErrorMessage(error, tDetail("actionError")));
    }
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
    <main className="space-y-6 p-6">
      <VisitWorkspaceHeader
        visit={visit}
        organizationId={organizationId}
        branchId={branchId}
        canComplete={!!canComplete}
        canCancel={canCancel}
        isMutating={updateStatus.isPending}
        onComplete={handleComplete}
        onCancel={handleCancel}
      />

      <Tabs
        value={activeTab}
        defaultValue="overview"
        onValueChange={(v) => setActiveTab(v as TabValue)}
      >
        <TabsList aria-label={t("tabsAria")}>
          <TabsTrigger value="overview">{t("tabs.overview")}</TabsTrigger>
          <TabsTrigger value="history">{t("tabs.history")}</TabsTrigger>
          <TabsTrigger value="examination">{t("tabs.examination")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <OverviewTab visit={visit} />
        </TabsContent>
        <TabsContent value="history" className="mt-6">
          <HistoryTab />
        </TabsContent>
        <TabsContent value="examination" className="mt-6">
          <ExaminationTab />
        </TabsContent>
      </Tabs>

      <CompleteVisitDialog
        open={completeDialogOpen}
        onOpenChange={setCompleteDialogOpen}
        visit={visit}
        onCompleted={() => toast.success(tDetail("completedToast"))}
      />
    </main>
  );
}
