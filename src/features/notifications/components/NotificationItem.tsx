// src/features/notifications/components/NotificationItem.tsx
"use client";

import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "../lib/utils";
import type { Notification, NotificationCategory } from "../types/notification.types";

const CATEGORY_ICON: Record<NotificationCategory, string> = {
  appointment: "📅",
  staff: "👥",
  medicine: "💊",
  patient: "🧑‍⚕️",
  report: "📊",
  system: "⚙️",
};

const CATEGORY_ICON_BG: Record<NotificationCategory, string> = {
  appointment: "bg-emerald-100",
  staff: "bg-violet-100",
  medicine: "bg-yellow-100",
  patient: "bg-blue-100",
  report: "bg-orange-100",
  system: "bg-gray-100",
};

const CATEGORY_BADGE_CLASS: Record<NotificationCategory, string> = {
  appointment: "bg-emerald-100 text-emerald-800",
  staff: "bg-violet-100 text-violet-800",
  medicine: "bg-yellow-100 text-yellow-800",
  patient: "bg-blue-100 text-blue-800",
  report: "bg-orange-100 text-orange-800",
  system: "bg-gray-100 text-gray-700",
};

type Props = {
  notification: Notification;
  variant: "compact" | "full";
  categoryLabel: string;
  onClick: (notification: Notification) => void;
};

export function NotificationItem({ notification, variant, categoryLabel, onClick }: Props) {
  const locale = useLocale();
  const { category, title, description, is_read, created_at } = notification;

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={() => onClick(notification)}
        className={cn(
          "w-full flex items-start gap-2.5 px-4 py-2.5 text-start transition-colors duration-100",
          "border-b border-gray-50 last:border-b-0",
          is_read ? "hover:bg-gray-50" : "bg-emerald-50/60 hover:bg-emerald-50",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40 focus-visible:ring-inset",
        )}
      >
        <span
          className={cn(
            "size-8 rounded-lg flex items-center justify-center text-sm shrink-0 mt-0.5",
            CATEGORY_ICON_BG[category],
          )}
        >
          {CATEGORY_ICON[category]}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-900 truncate">{title}</p>
          <p className="text-[11px] text-gray-500 leading-snug line-clamp-2">{description}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">{formatRelativeTime(created_at, locale)}</p>
        </div>
        {!is_read && (
          <span className="size-2 rounded-full bg-brand-primary shrink-0 mt-1.5" />
        )}
      </button>
    );
  }

  // full variant
  return (
    <button
      type="button"
      onClick={() => onClick(notification)}
      className={cn(
        "w-full flex items-start gap-3.5 px-6 py-3.5 text-start transition-colors duration-100",
        "border-b border-gray-50 last:border-b-0",
        is_read ? "hover:bg-gray-50" : "bg-emerald-50/60 hover:bg-emerald-50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40 focus-visible:ring-inset",
      )}
    >
      <span
        className={cn(
          "size-10 rounded-xl flex items-center justify-center text-lg shrink-0 mt-0.5",
          CATEGORY_ICON_BG[category],
        )}
      >
        {CATEGORY_ICON[category]}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900">{title}</p>
        <p className="text-xs text-gray-500 leading-relaxed line-clamp-3 mt-0.5">{description}</p>
        <p className="text-[11px] text-gray-400 mt-1">{formatRelativeTime(created_at, locale)}</p>
      </div>
      <div className="flex flex-col items-end gap-2 shrink-0">
        {!is_read && <span className="size-2 rounded-full bg-brand-primary mt-1" />}
        <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase tracking-wide", CATEGORY_BADGE_CLASS[category])}>
          {categoryLabel}
        </span>
      </div>
    </button>
  );
}
