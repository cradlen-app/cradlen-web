"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import {
  getActiveProfile,
  getDefaultBranch,
} from "@/features/auth/lib/current-user";
import {
  canAccessBilling,
  canCreateVisit as canCreateVisitPerm,
  hasAnyStaffRole,
  isReceptionist,
  showsAssignedVisits,
} from "@/features/auth/lib/permissions";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { InvoicePanel } from "@/features/financial/components/InvoicePanel";
import { InvoicePanelButton } from "@/features/financial/components/InvoicePanelButton";
import { useInvoices } from "@/features/financial/hooks/useInvoices";
import { CurrentVisitCard } from "@/features/visits/components/CurrentVisitCard";
import { InProgressByDoctorPanel } from "@/features/visits/components/InProgressByDoctorPanel";
import { VisitsOverviewPanel } from "@/features/visits/components/VisitsOverviewPanel";
import { WaitingListSection } from "@/features/visits/components/WaitingListSection";
import { useVisitSocket } from "@/features/visits/hooks/useVisitSocket";
import { getTodayIso } from "@/features/visits/lib/visits.utils";

export function VisitsPage() {
  const t = useTranslations("visits");
  const { data: user } = useCurrentUser();
  const branchId = useAuthContextStore((s) => s.branchId);
  const organizationId = useAuthContextStore((s) => s.organizationId);
  const profile = getActiveProfile(user);
  const branch = getDefaultBranch(profile, branchId ?? undefined);

  const profileId = useAuthContextStore((s) => s.profileId);
  const [selectedDate, setSelectedDate] = useState(() => getTodayIso());
  const [invoicePanelOpen, setInvoicePanelOpen] = useState(false);

  useVisitSocket(profileId, branchId);

  // Compute permissions before hooks that depend on them (hooks must not be
  // called after a conditional return, so showBilling is derived here).
  const showBilling = canAccessBilling(profile);
  const today = new Date().toISOString().split("T")[0]!;
  const { invoices } = useInvoices(
    showBilling ? { branch_id: branchId ?? undefined, date_from: today, date_to: today } : undefined,
  );

  if (!hasAnyStaffRole(profile)) return null;

  const showAssigned = showsAssignedVisits(profile);
  const canCreateVisit = canCreateVisitPerm(profile);
  // Anyone with a staff role and access to this page can manage visit status.
  const canManageStatus = hasAnyStaffRole(profile);

  const pendingCount = showBilling
    ? (invoices ?? []).filter((i) => i.status === "DRAFT").length
    : 0;

  return (
    <main className="space-y-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-brand-black">
            {t("pageTitle")}
          </h1>
          <p className="mt-0.5 text-xs text-gray-500">{t("breadcrumb")}</p>
        </div>
        {showBilling && (
          <InvoicePanelButton
            onClick={() => setInvoicePanelOpen(true)}
            pendingCount={pendingCount}
          />
        )}
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <section className="space-y-6 lg:col-span-3">
          {showAssigned && (
            <CurrentVisitCard
              branchId={branchId}
              organizationId={organizationId}
            />
          )}
          {isReceptionist(profile) && (
            <InProgressByDoctorPanel
              branchId={branchId}
              organizationId={organizationId}
            />
          )}
          <WaitingListSection
            branchId={branchId}
            organizationId={organizationId}
            branchName={branch?.name ?? branch?.city}
            canCreateVisit={canCreateVisit}
            canManageStatus={canManageStatus}
            assignedToMe={showAssigned}
            isDoctor={showAssigned}
          />
        </section>
        <aside className="hidden lg:block">
          <VisitsOverviewPanel
            branchId={branchId}
            selectedDate={selectedDate}
            onSelect={setSelectedDate}
            assignedToMe={showAssigned}
          />
        </aside>
      </div>

      {showBilling && (
        <InvoicePanel
          open={invoicePanelOpen}
          onOpenChange={setInvoicePanelOpen}
        />
      )}
    </main>
  );
}
