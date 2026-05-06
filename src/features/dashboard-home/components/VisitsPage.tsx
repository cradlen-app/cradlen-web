"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import {
  getActiveProfile,
  getActiveRole,
  getDefaultBranch,
} from "@/features/auth/lib/current-user";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { CurrentVisitCard } from "@/features/visits/components/CurrentVisitCard";
import { MiniCalendar } from "@/features/visits/components/MiniCalendar";
import { TodaysScheduleCard } from "@/features/visits/components/TodaysScheduleCard";
import { WaitingListSection } from "@/features/visits/components/WaitingListSection";
import { getTodayIso } from "@/features/visits/lib/visits.utils";

export function VisitsPage() {
  const t = useTranslations("visits");
  const { data: user } = useCurrentUser();
  const role = getActiveRole(user);
  const branchId = useAuthContextStore((s) => s.branchId);
  const organizationId = useAuthContextStore((s) => s.organizationId);
  const profile = getActiveProfile(user);
  const branch = getDefaultBranch(profile, branchId ?? undefined);

  const [selectedDate, setSelectedDate] = useState(() => getTodayIso());

  if (!role || role === "patient" || role === "unknown") return null;

  const canCreateVisit = role === "reception";
  const canStartVisit = role === "doctor";
  const canManageStatus = role === "reception" || role === "owner";
  const assignedToMe = role === "doctor";

  return (
    <main className="space-y-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-brand-black">
            {t("pageTitle")}
          </h1>
          <p className="mt-0.5 text-xs text-gray-500">{t("breadcrumb")}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="space-y-6 lg:col-span-2">
          <CurrentVisitCard
            branchId={branchId}
            canStartVisit={canStartVisit}
            assignedToMe={assignedToMe}
          />
          <WaitingListSection
            branchId={branchId}
            organizationId={organizationId}
            branchName={branch?.name ?? branch?.city}
            canCreateVisit={canCreateVisit}
            canManageStatus={canManageStatus}
            assignedToMe={assignedToMe}
          />
        </section>
        <aside className="hidden space-y-6 lg:block">
          <MiniCalendar
            selectedDate={selectedDate}
            onSelect={setSelectedDate}
          />
          <TodaysScheduleCard
            branchId={branchId}
            date={selectedDate}
            assignedToMe={assignedToMe}
          />
        </aside>
      </div>
    </main>
  );
}
