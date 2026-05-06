"use client";

import { cn } from "@/lib/utils";
import type {
  VisitPriority,
  VisitStatus,
  VisitType,
} from "../types/visits.types";

const TYPE_LABEL: Record<VisitType, string> = {
  VISIT: "Visit",
  FOLLOW_UP: "Follow-up",
  MEDICAL_REP: "Medical Rep",
};

const STATUS_LABEL: Record<VisitStatus, string> = {
  SCHEDULED: "Scheduled",
  CHECKED_IN: "Checked In",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  NO_SHOW: "No Show",
};

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
  return (
    <span className="inline-flex items-center rounded-full bg-gray-50 px-2.5 py-0.5 text-[11px] font-medium text-gray-600">
      {TYPE_LABEL[type] ?? type}
    </span>
  );
}

export function VisitStatusBadge({ status }: { status: VisitStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium",
        STATUS_STYLES[status] ?? "bg-gray-100 text-gray-600",
      )}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

export function VisitPriorityBadge({ priority }: { priority: VisitPriority }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium",
        PRIORITY_STYLES[priority] ?? "bg-gray-100 text-gray-600",
      )}
    >
      {priority === "EMERGENCY" ? "Emergency" : "Normal"}
    </span>
  );
}
