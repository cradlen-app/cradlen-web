"use client";

import type { ReactNode } from "react";
import { PalmtreeIcon, Stethoscope, User, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/common/utils/utils";
import type { CalendarEventType } from "../types/calendar.types";

type EventTypeCard = {
  type: CalendarEventType;
  icon: ReactNode;
  color: string;
  bgColor: string;
};

const EVENT_TYPE_CARDS: EventTypeCard[] = [
  {
    type: "DAY_OFF",
    icon: <PalmtreeIcon className="size-5" aria-hidden />,
    color: "text-amber-500",
    bgColor:
      "bg-amber-50 border-amber-200 data-[selected=true]:border-amber-500 data-[selected=true]:bg-amber-50",
  },
  {
    type: "PROCEDURE",
    icon: <Stethoscope className="size-5" aria-hidden />,
    color: "text-red-500",
    bgColor:
      "bg-red-50 border-red-200 data-[selected=true]:border-red-500 data-[selected=true]:bg-red-50",
  },
  {
    type: "MEETING",
    icon: <Users className="size-5" aria-hidden />,
    color: "text-brand-primary",
    bgColor:
      "bg-green-50 border-green-200 data-[selected=true]:border-brand-primary data-[selected=true]:bg-green-50",
  },
  {
    type: "GENERIC",
    icon: <User className="size-5" aria-hidden />,
    color: "text-gray-500",
    bgColor:
      "bg-gray-50 border-gray-200 data-[selected=true]:border-gray-500 data-[selected=true]:bg-gray-100",
  },
];

/** Grid of event-type cards shown as the first step of event creation. */
export function TypePicker({
  t,
  selected,
  onSelect,
}: {
  t: ReturnType<typeof useTranslations<"calendar">>;
  selected: CalendarEventType;
  onSelect: (type: CalendarEventType) => void;
}) {
  return (
    <div>
      <p className="mb-4 text-sm font-medium text-brand-black">
        {t("form.chooseType")}
      </p>
      <div className="grid grid-cols-2 gap-3">
        {EVENT_TYPE_CARDS.map((card) => (
          <button
            key={card.type}
            type="button"
            data-selected={selected === card.type}
            onClick={() => onSelect(card.type)}
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl border-2 px-4 py-5 text-center transition-all hover:opacity-90",
              card.bgColor,
            )}
          >
            <span className={card.color}>{card.icon}</span>
            <span className="text-sm font-medium text-brand-black">
              {t(`types.${card.type}`)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/** One row in the "who can see this event" audience selector. */
export function AudienceOption({
  active,
  icon,
  label,
  hint,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-3 rounded-lg border-2 px-3 py-2.5 text-start transition-all",
        active
          ? "border-brand-primary bg-brand-primary/5"
          : "border-gray-200 bg-white hover:border-gray-300",
      )}
      aria-pressed={active}
    >
      <span
        className={cn(
          "mt-0.5 shrink-0",
          active ? "text-brand-primary" : "text-gray-400",
        )}
      >
        {icon}
      </span>
      <span className="flex flex-col gap-0.5">
        <span
          className={cn(
            "text-xs font-medium",
            active ? "text-brand-primary" : "text-brand-black",
          )}
        >
          {label}
        </span>
        <span className="text-[11px] text-gray-500">{hint}</span>
      </span>
    </button>
  );
}
