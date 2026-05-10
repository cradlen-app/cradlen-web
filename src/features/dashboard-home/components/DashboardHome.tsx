"use client";

import { Suspense, useState } from "react";
import { useTranslations } from "next-intl";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import {
  getActiveProfile,
  getDefaultBranch,
  getProfileOrganization,
} from "@/features/auth/lib/current-user";
import {
  hasAnyStaffRole,
  showsAssignedVisits,
} from "@/features/auth/lib/permissions";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { MiniCalendar } from "@/features/visits/components/MiniCalendar";
import { StatCards, StatCardsSkeleton } from "@/features/visits/components/StatCards";
import { TodaysScheduleCard, TodaysScheduleCardSkeleton } from "@/features/visits/components/TodaysScheduleCard";
import { UpNextPreview } from "@/features/visits/components/UpNextPreview";
import { getTodayIso } from "@/features/visits/lib/visits.utils";

export function DashboardHome() {
  const t = useTranslations("dashboardHome");
  const tDate = useTranslations("dashboardHome");
  const { data: user } = useCurrentUser();
  const branchId = useAuthContextStore((s) => s.branchId);
  const profile = getActiveProfile(user);
  const branch = getDefaultBranch(profile, branchId ?? undefined);
  const organization = getProfileOrganization(profile);

  const [selectedDate, setSelectedDate] = useState(() => getTodayIso());

  if (!hasAnyStaffRole(profile)) return null;

  const assignedToMe = showsAssignedVisits(profile);
  const todayLabel = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date());

  const greetingFirstName = user?.first_name ?? "";

  return (
    <main className="space-y-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-brand-black">
            {greetingFirstName
              ? t("titleWithName", { name: greetingFirstName })
              : t("title")}
          </h1>
          <p className="mt-0.5 text-xs text-gray-500">
            {organization?.name ?? ""}
            {branch?.city ? ` · ${branch.city}` : ""}
          </p>
        </div>
        <span className="inline-flex items-center rounded-full border border-gray-100 bg-white px-3 py-1 text-[11px] font-medium text-gray-500 shadow-sm">
          {tDate("todayBadge", { date: todayLabel })}
        </span>
      </header>

      {branchId ? (
        <Suspense fallback={<StatCardsSkeleton />}>
          <StatCards branchId={branchId} date={selectedDate} assignedToMe={assignedToMe} />
        </Suspense>
      ) : (
        <StatCardsSkeleton />
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="space-y-6 lg:col-span-2">
          {branchId ? (
            <Suspense fallback={<TodaysScheduleCardSkeleton />}>
              <TodaysScheduleCard
                branchId={branchId}
                date={selectedDate}
                assignedToMe={assignedToMe}
              />
            </Suspense>
          ) : (
            <TodaysScheduleCardSkeleton />
          )}
          <UpNextPreview branchId={branchId} assignedToMe={assignedToMe} />
        </section>
        <aside className="space-y-6">
          <MiniCalendar
            selectedDate={selectedDate}
            onSelect={setSelectedDate}
          />
        </aside>
      </div>
    </main>
  );
}
