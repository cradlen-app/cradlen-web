"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { VISIT_PRIORITY, VISIT_TYPE } from "../lib/visits.constants";
import type { WaitingListFilter } from "../types/visits.types";

type Props = {
  value: WaitingListFilter;
  onChange: (next: WaitingListFilter) => void;
};

export function WaitingListFilters({ value, onChange }: Props) {
  const t = useTranslations("visits");
  const options: Array<{ value: WaitingListFilter; label: string }> = [
    { value: "all", label: t("filter.all") },
    { value: VISIT_TYPE.VISIT, label: t("type.visit") },
    { value: VISIT_TYPE.FOLLOW_UP, label: t("type.followUp") },
    { value: VISIT_TYPE.MEDICAL_REP, label: t("type.medicalRep") },
    { value: VISIT_PRIORITY.EMERGENCY, label: t("priority.emergency") },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex h-7 items-center rounded-full border px-3 text-xs font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30",
              isActive
                ? "border-brand-primary bg-brand-primary text-white"
                : "border-gray-100 bg-white text-gray-500 hover:border-brand-primary/40 hover:text-brand-black",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
