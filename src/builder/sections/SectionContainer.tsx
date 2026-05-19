"use client";

import type { ReactNode } from "react";
import { SectionTitle } from "../fields/field-shell";

function formatSectionDate(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso));
}

interface Props {
  title: string;
  children: ReactNode;
  /** Slot rendered on the right side of the section header (e.g. visibility toggle). */
  headerSlot?: ReactNode;
  /** Slot rendered below the fields grid (e.g. inline notes panel). */
  bottomSlot?: ReactNode;
  /** When true, collapses to header only — children are not rendered. */
  collapsed?: boolean;
  /**
   * Layout for the body. "grid" (default) is the 2-column field grid used for
   * singleton sections. "stack" is a vertical stack used for repeatable
   * sections (each row owns its own internal grid).
   */
  layout?: "grid" | "stack";
  /** ISO timestamp of the last update to this section's data. When provided, renders a "last update: …" label next to the title. */
  lastUpdatedAt?: string | null;
  /** Label text for the last-updated timestamp. Defaults to "last update:" for backward compatibility. */
  lastUpdatedAtLabel?: string;
}

export function SectionContainer({
  title,
  children,
  headerSlot,
  bottomSlot,
  collapsed,
  layout = "grid",
  lastUpdatedAt,
  lastUpdatedAtLabel = "last update:",
}: Props) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <SectionTitle title={title} />
          {lastUpdatedAt && (
            <span className="text-xs text-muted-foreground font-normal ml-2">
              {lastUpdatedAtLabel} {formatSectionDate(lastUpdatedAt)}
            </span>
          )}
        </div>
        {headerSlot}
      </div>
      {!collapsed && (
        <>
          <div
            className={
              layout === "stack"
                ? "space-y-2"
                : "grid grid-cols-12 gap-x-6 gap-y-3"
            }
          >
            {children}
          </div>
          {bottomSlot}
        </>
      )}
    </section>
  );
}
