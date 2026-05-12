"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/common/utils/utils";
import type {
  VisitPriority,
  VisitStatus,
  VisitType,
} from "../types/visits.types";

const STATUS_STYLES: Record<VisitStatus, string> = {
  SCHEDULED: "bg-blue-50 text-blue-700",
  CHECKED_IN: "bg-amber-50 text-amber-700",
  IN_PROGRESS: "bg-brand-primary/10 text-brand-primary",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-red-50 text-red-600",
  NO_SHOW: "bg-gray-100 text-gray-500",
};

const PRIORITY_STYLES: Record<VisitPriority, string> = {
  EMERGENCY: "bg-red-50 text-red-600",
  NORMAL: "bg-gray-100 text-gray-600",
};

export function VisitTypeBadge({ type }: { type: VisitType }) {
  const t = useTranslations("visits");
  const labelMap: Record<VisitType, string> = {
    VISIT: t("type.visit"),
    FOLLOW_UP: t("type.followUp"),
    MEDICAL_REP: t("type.medicalRep"),
  };
  return (
    <span className="inline-flex items-center rounded-full bg-gray-50 px-2.5 py-0.5 text-[11px] font-medium text-gray-600">
      {labelMap[type] ?? type}
    </span>
  );
}

export function VisitStatusBadge({ status }: { status: VisitStatus }) {
  const t = useTranslations("visits");
  const labelMap: Record<VisitStatus, string> = {
    SCHEDULED: t("status.scheduled"),
    CHECKED_IN: t("status.checkedIn"),
    IN_PROGRESS: t("status.inProgress"),
    COMPLETED: t("status.completed"),
    CANCELLED: t("status.cancelled"),
    NO_SHOW: t("status.noShow"),
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium",
        STATUS_STYLES[status] ?? "bg-gray-100 text-gray-600",
      )}
    >
      {labelMap[status] ?? status}
    </span>
  );
}

export function VisitPriorityBadge({ priority }: { priority: VisitPriority }) {
  const t = useTranslations("visits");
  const labelMap: Record<VisitPriority, string> = {
    NORMAL: t("priority.normal"),
    EMERGENCY: t("priority.emergency"),
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium",
        PRIORITY_STYLES[priority] ?? "bg-gray-100 text-gray-600",
      )}
    >
      {labelMap[priority] ?? priority}
    </span>
  );
}
