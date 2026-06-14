import { cn } from "@/common/utils/utils";
import type { CalendarEventType } from "../types/calendar.types";

export const TYPE_CHIP_CLASS: Record<CalendarEventType, string> = {
  DAY_OFF: "bg-amber-500 text-white",
  PROCEDURE: "bg-red-500 text-white",
  MEETING: "bg-brand-primary text-white",
  GENERIC: "bg-gray-400 text-white",
};

export const TYPE_BAR_CLASS: Record<CalendarEventType, string> = {
  DAY_OFF: "bg-amber-500",
  PROCEDURE: "bg-red-500",
  MEETING: "bg-brand-primary",
  GENERIC: "bg-gray-400",
};

type Props = {
  title: string;
  type: CalendarEventType;
  creatorName?: string | null;
  isContinuation?: boolean;
  className?: string;
};

export function CalendarEventChip({
  title,
  type,
  creatorName,
  isContinuation,
  className,
}: Props) {
  return (
    <span
      className={cn(
        "block px-1.5 py-0.5 leading-tight",
        isContinuation ? "rounded-e opacity-70" : "rounded",
        TYPE_CHIP_CLASS[type],
        className,
      )}
      title={creatorName ? `${title} · ${creatorName}` : title}
    >
      <span className="block truncate text-[10px] font-medium">
        {isContinuation ? `↳ ${title}` : title}
      </span>
      {creatorName && (
        <span className="block truncate text-[9px] font-normal opacity-80">
          {creatorName}
        </span>
      )}
    </span>
  );
}
