"use client";

import {
  AlertTriangle,
  Bell,
  MessageSquare,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/common/utils/utils";

type RailSection = {
  key: "redFlags" | "alerts" | "compliments" | "comments";
  icon: LucideIcon;
  tone: "danger" | "warning" | "accent" | "muted";
};

const SECTIONS: RailSection[] = [
  { key: "redFlags", icon: AlertTriangle, tone: "danger" },
  { key: "alerts", icon: Bell, tone: "warning" },
  { key: "compliments", icon: Sparkles, tone: "accent" },
  { key: "comments", icon: MessageSquare, tone: "muted" },
];

const TONES: Record<RailSection["tone"], string> = {
  danger: "text-red-600",
  warning: "text-amber-600",
  accent: "text-brand-primary",
  muted: "text-gray-500",
};

export function VisitContextRail() {
  const t = useTranslations("visits.workspace.rail");
  return (
    <aside className="divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white shadow-sm">
      {SECTIONS.map(({ key, icon: Icon, tone }) => (
        <section key={key} className="p-4">
          <header className="flex items-center gap-2">
            <Icon
              className={cn("size-4", TONES[tone])}
              aria-hidden="true"
            />
            <h3 className={cn("text-sm font-semibold", TONES[tone])}>
              {t(`${key}.title`)}
            </h3>
          </header>
          <p className="mt-3 text-xs text-gray-400">{t(`${key}.empty`)}</p>
        </section>
      ))}
    </aside>
  );
}
