"use client";

import type { ReactNode } from "react";
import { SectionTitle } from "../fields/field-shell";

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
  /** HTML id applied to the root <section> — used as a scroll anchor. */
  id?: string;
}

export function SectionContainer({
  title,
  children,
  headerSlot,
  bottomSlot,
  collapsed,
  layout = "grid",
  id,
}: Props) {
  return (
    <section id={id} className="space-y-3">
      <div className="flex items-center justify-between">
        <SectionTitle title={title} />
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
