"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/common/utils/utils";

type DataTablePaginationProps = {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  /**
   * Pre-resolved labels. Callers pass strings rather than a namespace because
   * each table reads from a different message source — migrated modules keep
   * their own `messages/{en,ar}.json`, legacy features use `src/messages`.
   */
  labels: { prev: string; next: string; pageOf: string };
  className?: string;
};

const navButton = cn(
  "inline-flex size-7 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors",
  "hover:border-brand-primary/40 hover:text-brand-primary",
  "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:text-gray-500",
);

/** Compact prev / "Page X of Y" / next control shared by the dashboard tables. */
export function DataTablePagination({
  page,
  pageCount,
  onPageChange,
  labels,
  className,
}: DataTablePaginationProps) {
  if (pageCount <= 1) return null;

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        aria-label={labels.prev}
        className={navButton}
      >
        <ChevronLeft className="size-3.5 rtl:rotate-180" aria-hidden="true" />
      </button>
      <span className="px-1.5 text-xs tabular-nums text-gray-500">
        {labels.pageOf}
      </span>
      <button
        type="button"
        onClick={() => onPageChange(Math.min(pageCount, page + 1))}
        disabled={page >= pageCount}
        aria-label={labels.next}
        className={navButton}
      >
        <ChevronRight className="size-3.5 rtl:rotate-180" aria-hidden="true" />
      </button>
    </div>
  );
}
