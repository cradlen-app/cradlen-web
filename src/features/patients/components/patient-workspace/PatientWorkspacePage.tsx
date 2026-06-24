"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import {
  getActiveProfile,
  getOrganizationSpecialtyCodes,
} from "@/features/auth/lib/current-user";
import {
  canManagePatient,
  canOpenPatientWorkspace,
} from "@/features/auth/lib/permissions";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { usePatient } from "@/features/patients/hooks/usePatient";
import { PatientOverview } from "@/features/visits/components/visit-workspace/overview/PatientOverview";
// Context rail hidden until the Red Flags / Alerts / Comments features are built.
// import { VisitContextRail } from "@/features/visits/components/visit-workspace/overview/VisitContextRail";
import { HistoryTab } from "@/features/visits/components/visit-workspace/tabs/HistoryTab";
import { PatientProfileDrawer } from "./PatientProfileDrawer";

type Props = {
  patientId: string;
};

export function PatientWorkspacePage({ patientId }: Props) {
  const t = useTranslations("patients.workspace");
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const profile = getActiveProfile(user);
  const organizationId = useAuthContextStore((s) => s.organizationId);
  const branchId = useAuthContextStore((s) => s.branchId);
  const specialtyCode = getOrganizationSpecialtyCodes(profile)[0] ?? null;

  const { data, isLoading, isError } = usePatient(patientId);
  const patient = data?.data ?? null;
  const fullName = patient?.full_name ?? "";

  const [activeTab, setActiveTab] = useState<string>("overview");
  const [editingProfile, setEditingProfile] = useState(false);
  const canManage = canManagePatient(profile);

  if (userLoading) {
    return (
      <main className="space-y-6 p-6">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-100" />
        <div className="h-64 animate-pulse rounded-2xl bg-gray-50" />
      </main>
    );
  }

  if (!canOpenPatientWorkspace(profile)) {
    return (
      <main className="space-y-4 p-6">
        <p className="rounded-xl border border-amber-100 bg-amber-50/50 px-4 py-3 text-xs text-amber-700">
          {t("notAuthorized")}
        </p>
      </main>
    );
  }

  const patientsHref =
    organizationId && branchId
      ? `/${organizationId}/${branchId}/dashboard/patients`
      : "#";

  return (
    <main className="flex h-full flex-col gap-6 overflow-hidden p-6">
      <header className="flex items-center justify-between gap-2">
        <Breadcrumbs
          items={[
            { label: t("back"), href: patientsHref },
            { label: fullName || (isLoading ? "…" : t("title")) },
          ]}
        />
        {canManage && patient && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setEditingProfile(true)}
          >
            <Pencil className="size-3.5" aria-hidden="true" />
            {t("edit")}
          </Button>
        )}
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-6">{/* xl:grid-cols-[minmax(0,1fr)_minmax(260px,320px)] — restore when the context rail returns */}
        <Tabs
          value={activeTab}
          defaultValue="overview"
          onValueChange={setActiveTab}
          className="flex h-full min-h-0 flex-col"
        >
          <TabsList aria-label={t("tabsAria")}>
            <TabsTrigger value="overview">{t("tabs.overview")}</TabsTrigger>
            <TabsTrigger value="history">{t("tabs.history")}</TabsTrigger>
          </TabsList>

          <TabsContent
            value="overview"
            className="min-h-0 flex-1 overflow-hidden"
          >
            <PatientOverview
              patientId={patientId}
              specialtyCode={specialtyCode}
              excludeVisitId=""
              patientDateOfBirth={patient?.date_of_birth}
            />
          </TabsContent>
          <TabsContent
            value="history"
            className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden rounded-2xl border border-gray-100 bg-white shadow-sm p-6"
          >
            <HistoryTab patientId={patientId} specialtyCode={specialtyCode} />
          </TabsContent>
        </Tabs>

        {/* Context rail hidden until built:
        <VisitContextRail
          patientId={patientId}
          onNavigateToHistory={() => setActiveTab("history")}
        /> */}
      </div>

      {patient && (
        <PatientProfileDrawer
          patient={patient}
          open={editingProfile}
          onOpenChange={setEditingProfile}
        />
      )}
    </main>
  );
}
