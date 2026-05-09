import { cn } from "@/lib/utils";
import type { CalendarEventType } from "../types/calendar.types";

export const TYPE_CHIP_CLASS: Record<CalendarEventType, string> = {
  SURGERY: "bg-red-500 text-white",
  MEETING: "bg-brand-primary text-white",
  PERSONAL: "bg-amber-500 text-white",
  LEAVE: "bg-gray-400 text-white",
};

export const TYPE_BAR_CLASS: Record<CalendarEventType, string> = {
  SURGERY: "bg-red-500",
  MEETING: "bg-brand-primary",
  PERSONAL: "bg-amber-500",
  LEAVE: "bg-gray-400",
};

type Props = {
  title: string;
  type: CalendarEventType;
  isContinuation?: boolean;
  className?: string;
};

export function CalendarEventChip({ title, type, isContinuation, className }: Props) {
  return (
    <span
      className={cn(
        "block truncate px-1.5 py-0.5 text-[10px] font-medium leading-tight",
        isContinuation ? "rounded-e opacity-70" : "rounded",
        TYPE_CHIP_CLASS[type],
        className,
      )}
      title={title}
    >
      {isContinuation ? `↳ ${title}` : title}
    </span>
  );
}
