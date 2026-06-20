"use client";

import { User } from "lucide-react";

import { cn } from "@/common/utils/utils";
import { usePatientProfiles } from "../../hooks/usePatientProfiles";
import type { PatientProfile } from "../../types/patient-portal.types";

/** First letter of the first two name parts, e.g. "Asmaa Mohamed" → "AM". */
function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

/** Alternating brand tones so stacked avatars stay distinguishable. */
const TONES = [
  "bg-brand-primary text-white",
  "bg-brand-secondary text-brand-primary",
  "bg-brand-primary/80 text-white",
];

function Avatar({ profile, index }: { profile: PatientProfile; index: number }) {
  const ring = "ring-2 ring-white";
  if (profile.imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={profile.imageUrl}
        alt={profile.fullName}
        className={cn("size-9 rounded-full object-cover", ring)}
      />
    );
  }
  const label = initials(profile.fullName);
  return (
    <div
      className={cn(
        "flex size-9 items-center justify-center rounded-full text-xs font-semibold",
        TONES[index % TONES.length],
        ring,
      )}
      title={profile.fullName}
    >
      {label || <User className="size-4" aria-hidden="true" />}
    </div>
  );
}

/**
 * Stacked avatars of the profiles the account can view (self + dependents),
 * mirroring the dashboard mockup's overlapping cluster. Self is shown first.
 * Renders nothing while profiles load or when only the account holder exists
 * with no avatar to show meaningfully.
 */
export function ProfileAvatarGroup({ max = 3 }: { max?: number }) {
  const { data: profiles } = usePatientProfiles();
  if (!profiles?.length) return null;

  const ordered = [...profiles].sort(
    (a, b) => Number(b.kind === "self") - Number(a.kind === "self"),
  );
  const shown = ordered.slice(0, max);
  const extra = ordered.length - shown.length;

  return (
    <div className="flex items-center -space-x-2 rtl:space-x-reverse">
      {shown.map((p, i) => (
        <Avatar key={p.id} profile={p} index={i} />
      ))}
      {extra > 0 && (
        <div className="flex size-9 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-500 ring-2 ring-white">
          +{extra}
        </div>
      )}
    </div>
  );
}
