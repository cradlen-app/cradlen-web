# Journey-centric clinical chart — standard

Status: **adopted** (mechanism shipped; pregnancy clinical vertical deferred).

## The model

One patient = one chart. Over time the chart holds a **sequence** of journeys; a
journey is a time-bounded clinical thread with a **start and end date** (a
pregnancy LMP→delivery, an infertility workup, a General-GYN thread). **At any
moment exactly ONE journey is ACTIVE** (`status=ACTIVE`, `ended_at` null) — the
rest are completed/historical. Journeys are sequential, never concurrent.

A **visit** is an encounter *within* the active journey. One visit serves two
things at once:

1. **The presenting encounter** — why the patient came today (e.g. pelvic pain).
   Documented in the **Examination tab**: chief complaint → care path →
   care-path-relevant history → exam → provisional diagnosis → treatment plan.
   Visit-scoped, guarded by `Visit.examination_version`.
2. **The active journey's surveillance** — the standing thread (e.g. the
   pregnancy) the doctor also checks during the visit. Captured in the
   **journey tab** (see below), with its **own version token**.

A pregnant woman presenting with pelvic pain therefore produces, in one visit, an
*Examination* entry (pelvic-pain workup) **and** a *Pregnancy* entry (journey
profile + today's maternal/fetal check) — both under the single active pregnancy
journey.

## Three scopes of a journey clinical surface

| Scope | Backing record (OB/GYN pregnancy example) | Cardinality |
|---|---|---|
| Journey profile | `PregnancyJourneyRecord` (`journey_id @unique`) | one per journey |
| Episode | `PregnancyEpisodeRecord` (`episode_id @unique`) | one per episode |
| Per-visit surveillance | `VisitPregnancyRecord` (`visit_id @unique`) | one per visit |

Encounter data (Examination) and journey data (journey tab) are **separate write
paths, separate version tokens, separate revision trails**.

## How a care path declares a clinical surface

`CarePathClinicalSurface (specialty_code, care_path_code) → { template_code,
label, order }` — a seed-editable lookup (mirrors `CarePathHistorySection`). A
care path with a row here renders **one** journey tab backed by `template_code`;
a care path with none renders no extra tab. Dormant until a row + the matching
template + the backend read/write endpoints exist.

## Contract

### Descriptor (live)
`GET /v1/visits/:visitId/journey` → `JourneyDescriptorDto | null`:
```ts
{
  journey_id, episode_id,
  care_path_code, specialty_code, label,   // care path code/name
  status, started_at, ended_at,
  clinical_surface: { template_code, label } | null
}
```
Resolves the visit's own episode → journey (for a live visit, the single active
journey) and folds in the surface. `null` → visit has no journey.
Frontend: `useVisitJourney(visitId)`; the workspace renders the journey tab only
when `clinical_surface` is non-null.

### Surface read/write (contract; concrete writer deferred to the pregnancy vertical)
- `GET  /v1/visits/:visitId/journeys/:journeyId/clinical` → flat envelope
  `{ journey_id, version, ...journey + per-visit fields }`.
- `PATCH /v1/visits/:visitId/journeys/:journeyId/clinical`, `If-Match:
  "version:N"` → composite write across journey/episode/visit records in one
  transaction; own `version` bump + `*_revisions` shadow (`buildRevision`);
  publishes `journey.clinical.updated` (catalogued in
  `@core/clinical/events/clinical-events`).

The envelope is **flat** (no namespace containers): the backend demuxes each
field into the right scoped record by its binding namespace. The generic
frontend tab (`JourneyClinicalTab`) therefore calls
`buildTemplateSubmission(template, state)` with no `namespaceContainers`.

## Frontend pieces (`src/features/journeys/`)
- `types/journey.types.ts` — `JourneyDescriptorDto`, `JourneyClinicalSurfaceDto`.
- `lib/journeys.api.ts` + `lib/useVisitJourney.ts` — descriptor fetch/hook.
- `lib/journey-clinical.api.ts` + `lib/useJourneyClinical.ts` — surface GET/PATCH.
- `components/JourneyClinicalTab.tsx` (+ `JourneyClinicalFormShell.tsx`) — generic,
  template-driven render + save, mirrors `ExaminationTab` (own `version`).
- `VisitWorkspacePage.tsx` — renders at most one dynamic `journey:<id>` tab.

## Adding a new journey vertical (e.g. pregnancy)
1. Re-activate / add the scoped records + a service implementing the surface
   GET/PATCH contract (revisions + `journey.clinical.updated`).
2. Seed the form template (`obgyn_pregnancy`) authoring journey + per-visit
   sections (bound to the scoped namespaces).
3. Add one `CarePathClinicalSurface` row (`OBGYN_PREGNANCY → obgyn_pregnancy`).
4. No frontend plumbing changes — the tab lights up automatically.
