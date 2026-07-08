"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
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
   * When true the section owns a collapse chevron and manages its own open/closed
   * state (initialised from `defaultCollapsed`). Use for phase sections the user
   * expands/collapses at will. When false, collapse is driven by `collapsed`.
   */
  collapsible?: boolean;
  /** Initial collapsed state for a self-managed (`collapsible`) section. */
  defaultCollapsed?: boolean;
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
  collapsible = false,
  defaultCollapsed = false,
  layout = "grid",
  id,
}: Props) {
  const [selfCollapsed, setSelfCollapsed] = useState(defaultCollapsed);
  // Self-managed sections own their state; otherwise the parent `collapsed`
  // prop drives it (header-only, no toggle).
  const isCollapsed = collapsible ? selfCollapsed : !!collapsed;

  return (
    <section id={id} className="space-y-3">
      <div className="flex items-center justify-between">
        {collapsible ? (
          <button
            type="button"
            onClick={() => setSelfCollapsed((c) => !c)}
            aria-expanded={!isCollapsed}
            className="flex items-center gap-1.5 text-left"
          >
            <ChevronDown
              size={16}
              className={`text-gray-400 transition-transform ${
                isCollapsed ? "-rotate-90" : ""
              }`}
            />
            <SectionTitle title={title} />
          </button>
        ) : (
          <SectionTitle title={title} />
        )}
        {headerSlot}
      </div>
      {!isCollapsed && (
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
