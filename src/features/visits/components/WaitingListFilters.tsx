"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { WaitingListFilter } from "../types/visits.types";

type Props = {
  value: WaitingListFilter;
  onChange: (next: WaitingListFilter) => void;
};

const OPTIONS: Array<{ value: WaitingListFilter; key: string }> = [
  { value: "all", key: "all" },
  { value: "visit", key: "visit" },
  { value: "follow_up", key: "followUp" },
  { value: "medical_rep", key: "medicalRep" },
  { value: "emergency", key: "emergency" },
];

export function WaitingListFilters({ value, onChange }: Props) {
  const t = useTranslations("visits.waitingList.filters");
  return (
    <div className="flex flex-wrap items-center gap-2">
      {OPTIONS.map((option) => {
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
            {t(option.key)}
          </button>
        );
      })}
    </div>
  );
}
