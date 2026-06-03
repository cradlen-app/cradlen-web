"use client";

import { ClipboardList, CalendarDays, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { ageFromDob } from "../../lib/format";
import { useActiveProfile } from "../../hooks/usePatientProfiles";
import { useHealthRecord } from "../../hooks/usePortalData";

/** Illustrated placeholder "photo" (inline SVG — no asset/dimension concerns). */
function AvatarPhoto() {
  return (
    <svg
      viewBox="0 0 160 160"
      className="size-20 rounded-full"
      role="img"
      aria-label="Profile photo"
    >
      <defs>
        <linearGradient id="ppc-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E8EEE8" />
          <stop offset="1" stopColor="#D6E0D2" />
        </linearGradient>
        <clipPath id="ppc-clip">
          <circle cx="80" cy="80" r="80" />
        </clipPath>
      </defs>
      <g clipPath="url(#ppc-clip)">
        <rect width="160" height="160" fill="url(#ppc-bg)" />
        <circle cx="80" cy="64" r="30" fill="#11604C" opacity="0.85" />
        <path
          d="M24 160c0-30.9 25.1-56 56-56s56 25.1 56 56z"
          fill="#11604C"
          opacity="0.85"
        />
      </g>
    </svg>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 text-center">
      <p className="text-sm font-bold text-brand-black">{value}</p>
      <p className="mt-0.5 text-[11px] text-gray-400">{label}</p>
    </div>
  );
}

export function PatientProfileCard() {
  const t = useTranslations("patientPortal");
  const profile = useActiveProfile();
  const { data: record } = useHealthRecord();

  const age = ageFromDob(profile?.dateOfBirth);
  const weight = record?.vitals.at(-1)?.weightKg;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      {/* Identity */}
      <div className="flex flex-col items-center text-center">
        <AvatarPhoto />
        <p className="mt-3 text-base font-bold text-brand-black">
          {profile?.fullName ?? "—"}
        </p>
        {age !== undefined && (
          <p className="text-xs text-gray-400">
            {t("home.years", { count: age })}
          </p>
        )}
      </div>

      {/* Vitals */}
      <div className="mt-4 flex items-stretch gap-2 rounded-xl bg-gray-50 py-3">
        <Stat label={t("home.blood")} value={profile?.bloodType ?? "—"} />
        <div className="w-px bg-gray-200" />
        <Stat
          label={t("home.height")}
          value={
            profile?.heightCm != null
              ? `${profile.heightCm} ${t("home.cm")}`
              : "—"
          }
        />
        <div className="w-px bg-gray-200" />
        <Stat
          label={t("home.weight")}
          value={weight != null ? `${weight} ${t("home.kg")}` : "—"}
        />
      </div>

      {/* Quick links */}
      <div className="mt-4 space-y-1">
        <QuickLink
          href="/patient/record"
          icon={ClipboardList}
          label={t("home.myHealthRecords")}
        />
        <QuickLink
          href="/patient/appointments"
          icon={CalendarDays}
          label={t("home.appointments")}
        />
      </div>
    </div>
  );
}

function QuickLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof ClipboardList;
  label: string;
}) {
  return (
    <Link
      href={href as Parameters<typeof Link>[0]["href"]}
      className="flex items-center gap-3 rounded-xl px-2 py-2.5 text-sm font-medium text-brand-black transition-colors hover:bg-gray-50"
    >
      <span className="flex size-8 items-center justify-center rounded-lg bg-brand-secondary/15 text-brand-primary">
        <Icon className="size-4" />
      </span>
      <span className="flex-1 truncate">{label}</span>
      <ChevronRight className="size-4 text-gray-300 rtl:scale-x-[-1]" />
    </Link>
  );
}
