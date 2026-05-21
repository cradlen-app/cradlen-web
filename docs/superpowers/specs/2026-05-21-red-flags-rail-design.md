# Red Flags Rail — Design Spec

**Date:** 2026-05-21  
**Status:** Approved

## Context

The visit workspace has a right-side rail (`VisitContextRail`) with four placeholder sections — Red Flags, Alerts, Repeated Compliments, and Comments — all currently empty. The goal is to wire the **Red Flags** section to real data: patient field flags raised by clinicians while reviewing the patient's history. The other three sections remain as placeholders (mock dashes) for now.

---

## What We're Building

A live **Red Flags** panel inside `VisitContextRail` that:

1. Fetches field flags for the current patient via `useFieldFlags(patientId)`.
2. Groups flags by `section_code` — each unique section becomes a sub-label (e.g. `medical_history` → "Medical History").
3. Renders each flag as a row showing the flag's `note` as the primary text and `field_code` as a smaller secondary line.
4. Shows an `ExternalLink` icon button on each row that, when clicked, switches the workspace to the History tab and scrolls to the corresponding section.
5. Handles loading (skeleton) and empty states cleanly.
6. Alerts, Repeated Compliments, and Comments remain as styled placeholder dashes — no data wiring.

---

## Architecture

### Data Flow

```
VisitWorkspacePage
  ├── owns: activeTab (useState)
  ├── owns: visit.patient.id  (from useVisit)
  ├── passes to VisitContextRail:
  │     patientId: string
  │     onNavigateToHistory: (sectionCode: string) => void
  │
  ├── VisitContextRail
  │     calls: useFieldFlags(patientId)
  │     on redirect click: onNavigateToHistory(sectionCode)
  │
  └── HistoryTab (sections rendered by TemplateRenderer → SectionContainer)
        SectionContainer gets: id={section.code}  ← new
```

When `onNavigateToHistory(sectionCode)` fires in `VisitWorkspacePage`:
1. `setActiveTab("history")`
2. `requestAnimationFrame(() => document.getElementById(sectionCode)?.scrollIntoView({ behavior: "smooth", block: "start" }))`

The `requestAnimationFrame` gives the browser one frame to re-render after the React state update. This works when the History tab data is already cached (`staleTime: 30s`). If the History tab has never been opened in the current session, the sections may not yet be in the DOM and the scroll will silently no-op — acceptable for v1.

**Assumption:** `flag.section_code` values (e.g. `medical_history`) match the `code` field on `FormSectionDto` rendered by `TemplateRenderer`. The `SectionContainer` will be given `id={section.code}`, so the scroll target ID is the form section's code string. Field flags must be raised using those same codes for the redirect to land correctly.

### Flag Item Display

Each `FieldFlagDto` is rendered as:
- **Primary text**: `flag.note` if present, otherwise `flag.field_code` formatted as human-readable (replace `_` with spaces, title-case).
- **Secondary line**: `flag.field_code` (always shown, smaller + muted).
- **Redirect icon**: `ExternalLink` (Lucide, 12px), inside a small bordered button.

### Grouping

```ts
// Group flags by section_code
const grouped = flags.reduce<Record<string, FieldFlagDto[]>>((acc, flag) => {
  (acc[flag.section_code] ??= []).push(flag);
  return acc;
}, {});
```

Sub-label display: `section_code` with underscores replaced by spaces, title-cased (e.g. `surgical_history` → "Surgical History").

---

## Files to Change

| File | Change |
|---|---|
| `src/features/visits/components/visit-workspace/overview/VisitContextRail.tsx` | Add `patientId` + `onNavigateToHistory` props; fetch flags; render sub-grouped items with `ExternalLink` redirect; loading skeleton; empty state |
| `src/features/visits/components/visit-workspace/VisitWorkspacePage.tsx` | Pass `patientId={visit.patient.id}` + `onNavigateToHistory` callback to `<VisitContextRail />` |
| `src/builder/sections/SectionContainer.tsx` | Add optional `id?: string` prop and apply it to the root `<section>` element |
| `src/builder/renderer/TemplateRenderer.tsx` | Pass `id={section.code}` to each `<SectionContainer>` |

---

## Component Design

### `VisitContextRail` props (updated)

```ts
interface VisitContextRailProps {
  patientId: string;
  onNavigateToHistory: (sectionCode: string) => void;
}
```

### States

**Loading** — show a shimmer skeleton (3–4 lines of varying width) inside the Red Flags section body. Other three sections render their placeholder dashes as normal.

**Empty** — show the existing i18n key `visits.workspace.rail.redFlags.empty` ("No red flags yet for this patient.") centered and italicised in muted text.

**Loaded** — render sub-groups as described above.

### Redirect handler (in `VisitWorkspacePage`)

```ts
const handleNavigateToHistory = useCallback((sectionCode: string) => {
  setActiveTab("history");
  requestAnimationFrame(() => {
    document.getElementById(sectionCode)?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}, []);
```

---

## Out of Scope

- Alerts, Repeated Compliments, Comments — not wired to real data in this iteration.
- Creating or removing flags from the sidebar — read-only only.
- `SectionContainer` id anchors only affect the History tab scroll; no other tab is affected.

---

## Verification

1. Open a visit with a patient who has field flags. Red Flags section should show items grouped by section, with `ExternalLink` icons.
2. Click a redirect icon — workspace should switch to History tab and scroll smoothly to the correct section.
3. Open a visit with a patient with no flags — Red Flags shows the empty state message.
4. On initial load, Red Flags shows a shimmer skeleton before data arrives.
5. Alerts / Repeated Compliments / Comments show placeholder dashes.