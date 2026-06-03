"use client";

import { useMemo } from "react";
import {
  ChevronRight,
  HeartPulse,
  Pill,
  FlaskConical,
  type LucideIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { cn } from "@/common/utils/utils";
import { Link } from "@/i18n/navigation";
import { formatDate } from "../../lib/format";
import { useHealthRecord, useLabOrders, useMedications } from "../../hooks/usePortalData";

type Tone = "pink" | "indigo" | "rose";

const TONE: Record<Tone, { card: string; icon: string }> = {
  pink: { card: "bg-pink-50/70 border-pink-100", icon: "bg-pink-100 text-pink-600" },
  indigo: {
    card: "bg-indigo-50/70 border-indigo-100",
    icon: "bg-indigo-100 text-indigo-600",
  },
  rose: { card: "bg-rose-50/70 border-rose-100", icon: "bg-rose-100 text-rose-600" },
};

function StatCard({
  href,
  icon: Icon,
  tone,
  title,
  sub,
  bold,
}: {
  href: string;
  icon: LucideIcon;
  tone: Tone;
  title: string;
  sub: string;
  bold: string;
}) {
  const tones = TONE[tone];
  return (
    <Link
      href={href as Parameters<typeof Link>[0]["href"]}
      className={cn(
        "group flex flex-col rounded-2xl border p-4 transition-shadow hover:shadow-sm",
        tones.card,
      )}
    >
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            "flex size-9 items-center justify-center rounded-xl",
            tones.icon,
          )}
        >
          <Icon className="size-4.5" />
        </span>
        <span className="flex-1 text-sm font-semibold text-brand-black">
          {title}
        </span>
        <ChevronRight className="size-4 text-gray-400 transition-transform group-hover:translate-x-0.5 rtl:scale-x-[-1]" />
      </div>
      <span className="mt-3 text-xs text-gray-500">{sub}</span>
      <span className="mt-1 text-sm font-semibold text-brand-black">{bold}</span>
    </Link>
  );
}

/** Three summary cards: Consultations, Prescriptions, Lab Screenings. */
export function StatCards() {
  const t = useTranslations("patientPortal");
  const locale = useLocale();
  const { data: record } = useHealthRecord();
  const { data: meds } = useMedications();
  const { data: labs } = useLabOrders();

  const consultations = useMemo(
    () => (record?.visits ?? []).filter((v) => v.status === "completed"),
    [record],
  );
  const lastConsultation = consultations[0]?.date;

  const activeMeds = useMemo(
    () => (meds ?? []).filter((m) => m.status === "active"),
    [meds],
  );
  const lastAdded = activeMeds
    .map((m) => m.startDate)
    .sort()
    .at(-1);

  const labName = (labs ?? [])[0]?.name ?? "—";

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <StatCard
        href="/patient/record"
        icon={HeartPulse}
        tone="pink"
        title={t("home.consultations")}
        sub={t("home.lastConsultation", {
          date: formatDate(lastConsultation, locale),
        })}
        bold={t("home.allTimeConsultations", { count: consultations.length })}
      />
      <StatCard
        href="/patient/medications"
        icon={Pill}
        tone="indigo"
        title={t("home.prescriptions")}
        sub={t("home.lastAdded", { date: formatDate(lastAdded, locale) })}
        bold={t("home.availablePrescriptions", { count: activeMeds.length })}
      />
      <StatCard
        href="/patient/tests"
        icon={FlaskConical}
        tone="rose"
        title={t("home.labScreenings")}
        sub={t("home.labTests", { count: (labs ?? []).length })}
        bold={labName}
      />
    </div>
  );
}
