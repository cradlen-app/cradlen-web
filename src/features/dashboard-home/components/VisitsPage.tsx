"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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
import { InvoicePanel, InvoicePanelButton } from "@/core/financial/pages";
import { useBillingQueue, financialQueryKeys } from "@/core/financial/api";
import { cn } from "@/common/utils/utils";
import { CurrentVisitCard } from "@/features/visits/components/CurrentVisitCard";
import { InProgressByDoctorPanel } from "@/features/visits/components/InProgressByDoctorPanel";
import { WaitingListSection } from "@/features/visits/components/WaitingListSection";
import { useVisitSocket } from "@/features/visits/hooks/useVisitSocket";

export function VisitsPage() {
  const t = useTranslations("visits");
  const { data: user } = useCurrentUser();
  const branchId = useAuthContextStore((s) => s.branchId);
  const organizationId = useAuthContextStore((s) => s.organizationId);
  const profile = getActiveProfile(user);
  const branch = getDefaultBranch(profile, branchId ?? undefined);

  const profileId = useAuthContextStore((s) => s.profileId);
  const queryClient = useQueryClient();
  const [invoicePanelOpen, setInvoicePanelOpen] = useState(false);

  // Compute permissions before hooks that depend on them (hooks must not be
  // called after a conditional return, so showBilling is derived here).
  const showBilling = canAccessBilling(profile);

  // Reception gets a live nudge when a doctor adds a billable service mid-visit,
  // so they can collect for it; the billing queue/badge then refresh. The socket
  // hook holds this in a ref, so a fresh function each render won't churn the
  // connection — no memoization needed.
  const handleBillingChargeAdded = () => {
    if (!showBilling) return;
    toast.info(t("billing.chargeAddedToast"));
    void queryClient.invalidateQueries({
      queryKey: financialQueryKeys.all(),
    });
  };

  useVisitSocket(profileId, branchId, handleBillingChargeAdded);
  // Counts today's booked visits that still need invoicing (no invoice or a
  // DRAFT) — same set the InvoicePanel lists, so the badge and panel agree.
  const { pending } = useBillingQueue(branchId);

  if (!hasAnyStaffRole(profile)) return null;

  const showAssigned = showsAssignedVisits(profile);
  const canCreateVisit = canCreateVisitPerm(profile);
  // Anyone with a staff role and access to this page can manage visit status.
  const canManageStatus = hasAnyStaffRole(profile);

  const pendingCount = showBilling ? pending.length : 0;

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
          // Small screens open the billing drawer via this icon; on large
          // screens the panel is shown inline in the column, so it's hidden.
          <span className="lg:hidden">
            <InvoicePanelButton
              onClick={() => setInvoicePanelOpen(true)}
              pendingCount={pendingCount}
            />
          </span>
        )}
      </header>

      <div
        className={cn("grid grid-cols-1 gap-6", showBilling && "lg:grid-cols-4")}
      >
        <section className={cn("space-y-6", showBilling && "lg:col-span-3")}>
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
        {showBilling && (
          // Inline billing panel on large screens; its mobile drawer and
          // invoice drawer portal to <body>, so they still work on small
          // screens even though this aside is hidden there.
          <aside className="hidden lg:block">
            <InvoicePanel
              open={invoicePanelOpen}
              onOpenChange={setInvoicePanelOpen}
            />
          </aside>
        )}
      </div>
    </main>
  );
}
