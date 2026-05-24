"use client";

import { Receipt } from "lucide-react";
import { cn } from "@/common/utils/utils";

type Props = {
  onClick: () => void;
  pendingCount: number;
};

export function InvoicePanelButton({ onClick, pendingCount }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={
        pendingCount > 0
          ? `Open billing panel — ${pendingCount} visit${pendingCount !== 1 ? "s" : ""} pending`
          : "Open billing panel"
      }
      className={cn(
        "relative inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors",
        "hover:border-brand-primary/40 hover:bg-brand-primary/5 hover:text-brand-primary",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30",
      )}
    >
      <Receipt className="size-4" aria-hidden="true" />
      {pendingCount > 0 && (
        <span
          aria-hidden="true"
          className="absolute -top-1 -end-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[10px] font-semibold leading-none text-white tabular-nums"
        >
          {pendingCount > 99 ? "99+" : pendingCount}
        </span>
      )}
    </button>
  );
}
