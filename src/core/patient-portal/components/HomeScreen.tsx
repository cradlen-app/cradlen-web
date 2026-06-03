"use client";

import { useMemo, useState } from "react";
import { FileUp, FlaskConical, Pill, ClipboardList } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { formatDayMonth } from "../lib/format";
import { useActiveProfile } from "../hooks/usePatientProfiles";
import {
  useAppointments,
  useHealthRecord,
  useLabOrders,
  useReminders,
} from "../hooks/usePortalData";
import { ClinicTag, SectionCard } from "./portal-ui";
import { UploadDialog } from "./upload/UploadDialog";

export function HomeScreen() {
  const t = useTranslations("patientPortal");
  const locale = useLocale();
  const profile = useActiveProfile();
  const { data: appointments } = useAppointments();
  const { data: record } = useHealthRecord();
  const { data: orders } = useLabOrders();
  const { data: reminders } = useReminders();
  const [uploadOpen, setUploadOpen] = useState(false);

  const nextAppointment = useMemo(
    () => appointments?.find((a) => a.status === "upcoming"),
    [appointments],
  );

  const latestResults = useMemo(
    () =>
      (orders ?? [])
        .filter((o) => o.status !== "awaiting_upload")
        .slice(0, 3),
    [orders],
  );

  const firstName = profile?.fullName.split(" ")[0] ?? "";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-brand-black">
          {t("home.greeting", { name: firstName })}
        </h1>
        <p className="text-sm text-gray-500">{t("home.subtitle")}</p>
      </div>

      {/* Next appointment hero */}
      <div className="rounded-2xl bg-gradient-to-br from-brand-primary to-[#17795f] p-4 text-white shadow-sm">
        <p className="text-[10px] font-bold uppercase tracking-wide text-white/70">
          {t("home.nextAppointment")}
        </p>
        {nextAppointment ? (
          <>
            <p className="mt-1 text-lg font-bold">
              {formatDayMonth(nextAppointment.date, locale)}
              {nextAppointment.time ? ` · ${nextAppointment.time}` : ""}
            </p>
            <p className="mt-1 text-sm text-white/85">
              {nextAppointment.doctorName} · {nextAppointment.type} ·{" "}
              {nextAppointment.clinic.name}
            </p>
          </>
        ) : (
          <p className="mt-1 text-sm text-white/85">{t("home.noUpcoming")}</p>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-4 gap-2">
        <button
          type="button"
          onClick={() => setUploadOpen(true)}
          className="flex flex-col items-center gap-1 rounded-2xl border border-amber-200 bg-amber-50 p-3"
        >
          <FileUp className="size-5 text-amber-600" />
          <span className="text-[11px] font-semibold text-gray-700">
            {t("home.quickUpload")}
          </span>
        </button>
        <QuickLink href="/patient/record" icon={ClipboardList} label={t("home.quickRecord")} />
        <QuickLink href="/patient/medications" icon={Pill} label={t("home.quickMeds")} />
        <QuickLink href="/patient/tests" icon={FlaskConical} label={t("home.quickTests")} />
      </div>

      {/* Latest results */}
      <SectionCard
        title={t("home.latestResults")}
        action={
          <Link
            href="/patient/tests"
            className="text-xs font-semibold text-brand-primary"
          >
            {t("home.seeAll")} ›
          </Link>
        }
      >
        {latestResults.length === 0 ? (
          <p className="py-2 text-sm text-gray-400">{t("tests.none")}</p>
        ) : (
          <ul className="space-y-2">
            {latestResults.map((o) => (
              <li key={o.id} className="flex items-center gap-2.5">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{
                    background:
                      o.status === "result_ready" ? "#16a34a" : "#d97706",
                  }}
                />
                <span className="flex-1 truncate text-sm text-gray-700">
                  <span className="font-semibold text-brand-black">
                    {o.name}
                  </span>{" "}
                  · {t(`status.${o.status}` as Parameters<typeof t>[0])}
                </span>
                <ClinicTag clinic={o.clinic} />
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      {/* Active journey */}
      {record?.activeJourney && (
        <SectionCard title={t("home.activeJourney")}>
          <div className="flex items-center gap-2.5">
            <span className="size-2 shrink-0 rounded-full bg-brand-secondary" />
            <span className="text-sm text-gray-700">
              <span className="font-semibold text-brand-black">
                {record.activeJourney.name}
              </span>
              {record.activeJourney.stage
                ? ` · ${record.activeJourney.stage}`
                : ""}
            </span>
          </div>
        </SectionCard>
      )}

      {/* Reminders */}
      <SectionCard title={t("home.reminders")}>
        {reminders && reminders.length > 0 ? (
          <ul className="space-y-2">
            {reminders.map((r) => (
              <li key={r.id} className="flex items-center gap-2.5">
                <span className="size-2 shrink-0 rounded-full bg-brand-primary" />
                <span className="text-sm text-gray-700">
                  <span className="font-medium text-brand-black">{r.label}</span>
                  {r.detail ? ` · ${r.detail}` : ""}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-1 text-sm text-gray-400">{t("home.noReminders")}</p>
        )}
      </SectionCard>

      {uploadOpen && (
        <UploadDialog open onClose={() => setUploadOpen(false)} />
      )}
    </div>
  );
}

function QuickLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof Pill;
  label: string;
}) {
  return (
    <Link
      href={href as Parameters<typeof Link>[0]["href"]}
      className="flex flex-col items-center gap-1 rounded-2xl border border-gray-100 bg-white p-3"
    >
      <Icon className="size-5 text-brand-primary" />
      <span className="text-[11px] font-semibold text-gray-700">{label}</span>
    </Link>
  );
}
