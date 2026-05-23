# Visits Timeline — Real Data Integration

## Context

The visit workspace overview tab has a `VisitsHistoryList` component that renders a vertical timeline of a patient's past visits. It currently uses hardcoded mock data with a non-functional "Load More" button. This design replaces the mock with real paginated data fetched from a new backend endpoint, while preserving the existing UI/UX exactly.

---

## Backend

### New endpoint

```
GET /v1/patients/:patientId/visits/history
```

**Query params:**
- `page` (integer, default 1)
- `limit` (integer, default 3, max 100)
- `exclude` (optional UUID) — visit ID to omit (the currently open visit)

**Location:** `src/core/clinical/visits/visits.controller.ts`

**Service method:** `VisitsService.findPatientVisitHistory(patientId, orgId, query)`

**Prisma query shape:**
```
Visit.findMany({
  where: {
    episode: { journey: { patient_id: patientId, organization_id: orgId } },
    status: COMPLETED,
    id: { not: excludeId },   // omitted when exclude not supplied
    is_deleted: false,
  },
  orderBy: { completed_at: 'desc' },
  skip: (page - 1) * limit,
  take: limit,
  include: {
    encounter: { select: { provisional_diagnosis: true } },
    prescription: {
      include: {
        items: {
          where: { is_deleted: false },
          orderBy: { order: 'asc' },
          include: { medication: { select: { name: true } } },
        },
      },
    },
    investigations: {
      where: { is_deleted: false },
      include: { lab_test: { select: { name: true } } },
    },
  },
})
```

**Authorization:** `episode → journey → organization_id === user.organizationId` filter acts as the access guard — same pattern used by `findOne`. No new authorization methods needed.

### New DTO

**File:** `src/core/clinical/visits/dto/visit-history-summary.dto.ts`

```ts
class VisitHistoryMedicationDto {
  name: string;
  dose: string;
}

class VisitHistorySummaryDto {
  id: string;
  appointment_type: string;          // "VISIT" | "FOLLOW_UP"
  completed_at: Date;
  diagnosis: string | null;          // encounter.provisional_diagnosis
  medications: VisitHistoryMedicationDto[];
  investigations: string[];          // lab_test.name || custom_test_name
}
```

**Mapping logic in service:**
- `diagnosis` → `visit.encounter?.provisional_diagnosis ?? null`
- `medications` → `visit.prescription?.items.map(i => ({ name: i.medication?.name ?? i.custom_drug_name ?? '', dose: i.dose }))`
- `investigations` → `visit.investigations.map(i => i.lab_test?.name ?? i.custom_test_name ?? '').filter(Boolean)`

**Response:** `paginated(summaries, { page, limit, total })` → `{ data: VisitHistorySummaryDto[], meta: { page, limit, total, totalPages } }`

---

## Frontend

### New API type — `visits.api.types.ts`

```ts
type ApiVisitHistoryMedication = { name: string; dose: string };

type ApiVisitHistoryEntry = {
  id: string;
  appointment_type: "VISIT" | "FOLLOW_UP";
  completed_at: string;
  diagnosis: string | null;
  medications: ApiVisitHistoryMedication[];
  investigations: string[];
};

type ApiVisitHistoryResponse = {
  data: ApiVisitHistoryEntry[];
  meta: ApiPaginationMeta;
};
```

### New fetch function — `visits.api.ts`

```ts
fetchPatientVisitHistory({
  patientId,
  page = 1,
  limit = 3,
  excludeVisitId,
}: {
  patientId: string;
  page?: number;
  limit?: number;
  excludeVisitId?: string;
})
→ GET /patients/:patientId/visits/history?page=&limit=&exclude=
```

### New hook — `usePatientVisitHistory`

**File:** `src/features/visits/hooks/usePatientVisitHistory.ts`

```ts
usePatientVisitHistory({ patientId, excludeVisitId })
→ { entries, isLoading, isLoadingMore, hasMore, loadMore }
```

- On mount: fetches page 1, `limit=3`
- `loadMore()`: increments page, appends results to `entries` (accumulate, don't replace)
- `hasMore`: `entries.length < meta.total`
- `isLoading`: true only on the initial fetch (entries is empty)
- `isLoadingMore`: true when fetching subsequent pages

Uses `useState` for accumulated entries + current page. Uses `useEffect` for initial fetch. `loadMore` is a plain callback that fetches next page and appends.

### Updated `VisitsHistoryList`

**File:** `src/features/visits/components/visit-workspace/overview/VisitsHistoryList.tsx`

**Props added:** `{ patientId: string; excludeVisitId: string }`

**Data mapping** (API → display shape):
```ts
type VisitHistoryEntry = {
  id: string;
  date: string;          // completed_at ISO string
  type: "VISIT" | "FOLLOW_UP";
  diagnoses: string[];   // [diagnosis] if non-null, else []
  medications: string[]; // `${name} ${dose}` per item
  investigations: string[];
};
```

**States to handle:**
- `isLoading` (initial): render 3 skeleton placeholder cards in the same card shape
- `entries.length === 0` (after load): render an empty state message using `t("history.empty")`
- Error: render a brief error message (use existing error pattern from other hooks in the feature)
- Normal: existing timeline render, unchanged markup

**"Load More" button:**
- Hidden when `!hasMore`
- Shows a spinner (replace label) while `isLoadingMore`
- Calls `loadMore()` on click

**Remove:** `MOCK_HISTORY` constant and `MockVisitHistoryEntry` type.

### Updated `OverviewTab`

**File:** `src/features/visits/components/visit-workspace/tabs/OverviewTab.tsx`

```tsx
<VisitsHistoryList
  patientId={visit.patient.id}
  excludeVisitId={visit.id}
/>
```

---

## i18n

Add to the `visits.workspace.history` namespace (all locales):
- `empty` — "No previous visits found" / Arabic equivalent

---

## Verification

1. Open a visit workspace for a patient with completed past visits → timeline shows real data, newest first
2. "Load More" appends next 3 — button hides when all visits loaded
3. Patient with no completed history → empty state message shown
4. Current visit is not listed in the timeline
5. Run `npm run lint` and `npx tsc --noEmit` — no new errors