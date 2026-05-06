"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type {
  VisitPriority,
  VisitStatus,
  VisitType,
} from "../types/visits.types";

const TYPE_KEY: Record<VisitType, "visit" | "followUp" | "medicalRep"> = {
  visit: "visit",
  follow_up: "followUp",
  medical_rep: "medicalRep",
};

const STATUS_KEY: Record<
  VisitStatus,
  "pending" | "waiting" | "inProgress" | "completed" | "cancelled"
> = {
  pending: "pending",
  waiting: "waiting",
  in_progress: "inProgress",
  completed: "completed",
  cancelled: "cancelled",
};

const STATUS_STYLES: Record<VisitStatus, string> = {
  pending: "bg-amber-50 text-amber-700",
  waiting: "bg-gray-100 text-gray-600",
  in_progress: "bg-brand-primary/10 text-brand-primary",
  completed: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-red-50 text-red-600",
};

const PRIORITY_STYLES: Record<VisitPriority, string> = {
  emergency: "bg-red-50 text-red-600",
  normal: "bg-gray-100 text-gray-600",
};

export function VisitTypeBadge({ type }: { type: VisitType }) {
  const t = useTranslations("visits.type");
  return (
    <span className="inline-flex items-center rounded-full bg-gray-50 px-2.5 py-0.5 text-[11px] font-medium text-gray-600">
      {t(TYPE_KEY[type])}
    </span>
  );
}

export function VisitStatusBadge({ status }: { status: VisitStatus }) {
  const t = useTranslations("visits.status");
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium",
        STATUS_STYLES[status],
      )}
    >
      {t(STATUS_KEY[status])}
    </span>
  );
}

export function VisitPriorityBadge({ priority }: { priority: VisitPriority }) {
  const t = useTranslations("visits.priority");
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium",
        PRIORITY_STYLES[priority],
      )}
    >
      {t(priority)}
    </span>
  );
}
