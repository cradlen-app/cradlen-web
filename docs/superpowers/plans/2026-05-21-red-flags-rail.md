# Red Flags Rail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the `VisitContextRail` Red Flags section to live patient field-flag data, grouped by history section, with an `ExternalLink` icon that switches to the History tab and scrolls to the flagged section.

**Architecture:** `VisitWorkspacePage` already owns `activeTab` state and `visit.patient.id`. We add a `handleNavigateToHistory` callback there and pass it + `patientId` as props into `VisitContextRail`, which calls the existing `useFieldFlags` hook and renders grouped flag items. We also add an `id={section.code}` anchor to `SectionContainer` (via `TemplateRenderer`) so the scroll target exists in the DOM.

**Tech Stack:** Next.js 14 (App Router), React 18, TanStack Query v5, Lucide React, next-intl, Tailwind CSS.

---

## File Map

| File | Change |
|---|---|
| `src/builder/sections/SectionContainer.tsx` | Add optional `id?: string` prop → applied to root `<section>` |
| `src/builder/renderer/TemplateRenderer.tsx` | Pass `id={section.code}` to each `<SectionContainer>` |
| `src/features/visits/components/visit-workspace/overview/VisitContextRail.tsx` | Full rewrite — add props, fetch flags, render sub-grouped items, loading skeleton, empty state |
| `src/features/visits/components/visit-workspace/VisitWorkspacePage.tsx` | Add `handleNavigateToHistory` callback + pass new props to `<VisitContextRail />` |

---

## Task 1: Add `id` prop to `SectionContainer`

**Files:**
- Modify: `src/builder/sections/SectionContainer.tsx`

- [ ] **Step 1: Add `id` to the Props interface and the root `<section>`**

Replace the full file content with:

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add src/builder/sections/SectionContainer.tsx
git commit -m "feat(builder): add id prop to SectionContainer for scroll anchoring"
```

---

## Task 2: Pass `id={section.code}` in `TemplateRenderer`

**Files:**
- Modify: `src/builder/renderer/TemplateRenderer.tsx` (line 125)

- [ ] **Step 1: Add `id={section.code}` to the `<SectionContainer>` call**

Find the `<SectionContainer>` JSX block inside the `group.sections.map(...)` (around line 125) and add the `id` prop:

```tsx
<SectionContainer
  key={section.id}
  id={section.code}
  title={section.name}
  headerSlot={renderSectionHeaderSlot?.(section)}
  bottomSlot={
    !section.is_repeatable
      ? renderSectionBottomSlot?.(section)
      : undefined
  }
  collapsed={collapsedSections?.has(section.code)}
  layout={section.is_repeatable ? "stack" : "grid"}
>
```

The only change is the new `id={section.code}` line. Everything else stays identical.

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd F:/Cradlen/cradlen-web
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/builder/renderer/TemplateRenderer.tsx
git commit -m "feat(builder): pass section.code as scroll anchor id to SectionContainer"
```

---

## Task 3: Rewrite `VisitContextRail` with live Red Flags data

**Files:**
- Modify: `src/features/visits/components/visit-workspace/overview/VisitContextRail.tsx`

**Existing imports to keep:** `AlertTriangle`, `Bell`, `MessageSquare`, `Sparkles` from `lucide-react`; `useTranslations` from `next-intl`; `cn` from `@/common/utils/utils`.

**New imports:** `ExternalLink` from `lucide-react`; `useFieldFlags` from `@/features/patient-history/api/useFieldFlags`; `FieldFlagDto` from `@/features/patient-history/api/field-flags.api`.

- [ ] **Step 1: Replace the full file**

```tsx
"use client";

import {
  AlertTriangle,
  Bell,
  ExternalLink,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useFieldFlags } from "@/features/patient-history/api/useFieldFlags";
import type { FieldFlagDto } from "@/features/patient-history/api/field-flags.api";

interface Props {
  patientId: string;
  onNavigateToHistory: (sectionCode: string) => void;
}

function toTitleCase(str: string): string {
  return str
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function groupBySection(
  flags: FieldFlagDto[],
): Record<string, FieldFlagDto[]> {
  return flags.reduce<Record<string, FieldFlagDto[]>>((acc, flag) => {
    (acc[flag.section_code] ??= []).push(flag);
    return acc;
  }, {});
}

function RedFlagsSkeleton() {
  return (
    <div className="mt-2 space-y-2">
      {[80, 60, 75, 50].map((w) => (
        <div
          key={w}
          className="h-3 animate-pulse rounded bg-gray-100"
          style={{ width: `${w}%` }}
        />
      ))}
    </div>
  );
}

export function VisitContextRail({ patientId, onNavigateToHistory }: Props) {
  const t = useTranslations("visits.workspace.rail");
  const { data: flags, isLoading } = useFieldFlags(patientId);

  const grouped = flags ? groupBySection(flags) : {};
  const hasFlags = flags && flags.length > 0;

  return (
    <aside className="h-full divide-y divide-gray-100 overflow-y-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
      {/* ── Red Flags (live data) ── */}
      <section className="p-4">
        <header className="flex items-center gap-2">
          <AlertTriangle className="size-4 text-red-600" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-red-600">
            {t("redFlags.title")}
          </h3>
        </header>

        {isLoading ? (
          <RedFlagsSkeleton />
        ) : !hasFlags ? (
          <p className="mt-3 text-xs italic text-gray-400">
            {t("redFlags.empty")}
          </p>
        ) : (
          <div className="mt-3 space-y-4">
            {Object.entries(grouped).map(([sectionCode, sectionFlags]) => (
              <div key={sectionCode}>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  {toTitleCase(sectionCode)}
                </p>
                <ul className="space-y-1">
                  {sectionFlags.map((flag) => (
                    <li
                      key={flag.id}
                      className="group flex items-start gap-1.5 rounded-md px-1.5 py-1 hover:bg-gray-50"
                    >
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-red-500" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs leading-snug text-gray-800">
                          {flag.note ?? toTitleCase(flag.field_code)}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {flag.field_code}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onNavigateToHistory(flag.section_code)}
                        className="mt-0.5 shrink-0 rounded border border-gray-200 bg-white p-0.5 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100 hover:border-gray-300 hover:text-gray-600"
                        title={`Go to ${toTitleCase(sectionCode)} in History`}
                      >
                        <ExternalLink className="size-3" aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Alerts (placeholder) ── */}
      <section className="p-4">
        <header className="flex items-center gap-2">
          <Bell className="size-4 text-amber-600" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-amber-600">
            {t("alerts.title")}
          </h3>
        </header>
        <p className="mt-3 text-xs text-gray-400">{t("alerts.empty")}</p>
      </section>

      {/* ── Repeated Compliments (placeholder) ── */}
      <section className="p-4">
        <header className="flex items-center gap-2">
          <Sparkles
            className="size-4 text-brand-primary"
            aria-hidden="true"
          />
          <h3 className="text-sm font-semibold text-brand-primary">
            {t("compliments.title")}
          </h3>
        </header>
        <p className="mt-3 text-xs text-gray-400">{t("compliments.empty")}</p>
      </section>

      {/* ── Comments (placeholder) ── */}
      <section className="p-4">
        <header className="flex items-center gap-2">
          <MessageSquare
            className="size-4 text-gray-500"
            aria-hidden="true"
          />
          <h3 className="text-sm font-semibold text-gray-500">
            {t("comments.title")}
          </h3>
        </header>
        <p className="mt-3 text-xs text-gray-400">{t("comments.empty")}</p>
      </section>
    </aside>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd F:/Cradlen/cradlen-web
npx tsc --noEmit
```

Expected: no errors. The new props (`patientId`, `onNavigateToHistory`) will cause a type error in `VisitWorkspacePage.tsx` until Task 4 is done — that's expected at this point.

- [ ] **Step 3: Commit**

```bash
git add src/features/visits/components/visit-workspace/overview/VisitContextRail.tsx
git commit -m "feat(visits): wire VisitContextRail Red Flags to live field-flag data"
```

---

## Task 4: Pass props from `VisitWorkspacePage`

**Files:**
- Modify: `src/features/visits/components/visit-workspace/VisitWorkspacePage.tsx`

- [ ] **Step 1: Add `useCallback` to the React import and define the handler**

At line 3, change:
```tsx
import { useState } from "react";
```
to:
```tsx
import { useCallback, useState } from "react";
```

Then, after the `[activeTab, setActiveTab]` line (line 43), add:

```tsx
const handleNavigateToHistory = useCallback((sectionCode: string) => {
  setActiveTab("history");
  requestAnimationFrame(() => {
    document.getElementById(sectionCode)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  });
}, []);
```

- [ ] **Step 2: Pass props to `<VisitContextRail />`**

Find line 154:
```tsx
<VisitContextRail />
```

Replace with:
```tsx
<VisitContextRail
  patientId={visit.patient.id}
  onNavigateToHistory={handleNavigateToHistory}
/>
```

- [ ] **Step 3: Verify TypeScript compiles with no errors**

```bash
cd F:/Cradlen/cradlen-web
npx tsc --noEmit
```

Expected: clean output, no errors.

- [ ] **Step 4: Commit**

```bash
git add src/features/visits/components/visit-workspace/VisitWorkspacePage.tsx
git commit -m "feat(visits): connect VisitWorkspacePage to VisitContextRail with patientId and history navigation"
```

---

## Verification

After all tasks are committed, manually verify the following:

1. **Data renders** — Open a visit for a patient who has field flags. The Red Flags section shows items grouped by their `section_code` (formatted as "Medical History", "Surgical History", etc.). Each item shows the `note` text (or `field_code` title-cased if no note), with the raw `field_code` as a smaller muted line beneath.

2. **Redirect works** — Hover a flag item to reveal the `ExternalLink` icon. Click it. The workspace switches to the History tab and scrolls smoothly to the matching section.

3. **Empty state** — Open a visit for a patient with no flags. The Red Flags section shows the italic "No red flags yet for this patient." message.

4. **Loading skeleton** — On a slow connection (or with DevTools throttling set to "Slow 3G"), open a visit. The Red Flags section shows four animated shimmer lines before data arrives.

5. **Placeholder sections** — Alerts, Repeated Compliments, and Comments show their empty-state text and no data rows.

6. **No TypeScript errors** — `npx tsc --noEmit` passes cleanly.