# Visits Timeline — Real Data Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace hardcoded mock data in `VisitsHistoryList` with real paginated data from a new `GET /patients/:patientId/visits/history` endpoint, showing 3 completed visits at a time with a working "Load More" button.

**Architecture:** New backend endpoint on `VisitsController` queries `COMPLETED` visits for a patient (filtered to the caller's org), joining encounter/prescription/investigations in one Prisma query. Frontend uses `useInfiniteQuery` in a new `usePatientVisitHistory` hook; `VisitsHistoryList` is updated to accept `patientId` + `excludeVisitId` props and renders real data with skeleton/empty states.

**Tech Stack:** NestJS + Prisma (backend), Next.js + TanStack Query `useInfiniteQuery` (frontend), next-intl (i18n), Jest (backend unit tests)

---

## File Map

**Create:**
- `src/core/clinical/visits/dto/visit-history-summary.dto.ts` — response DTO shape
- `src/features/visits/hooks/usePatientVisitHistory.ts` — infinite-query hook

**Modify:**
- `src/core/clinical/visits/visits.service.ts` — add `findPatientVisitHistory` method
- `src/core/clinical/visits/visits.controller.ts` — add `GET /patients/:patientId/visits/history` route
- `src/core/clinical/visits/visits.service.spec.ts` — unit test for the new service method
- `src/features/visits/types/visits.api.types.ts` — add `ApiVisitHistoryEntry` + response types
- `src/features/visits/lib/visits.api.ts` — add `fetchPatientVisitHistory`
- `src/lib/queryKeys.ts` — add `patientHistory` key under `visits`
- `src/features/visits/components/visit-workspace/overview/VisitsHistoryList.tsx` — replace mock with hook
- `src/features/visits/components/visit-workspace/tabs/OverviewTab.tsx` — pass props
- `src/messages/en.json` — add `empty` + `loading` keys
- `src/messages/ar.json` — add `empty` + `loading` keys

---

## Task 1: Backend — `VisitHistorySummaryDto`

**Files:**
- Create: `src/core/clinical/visits/dto/visit-history-summary.dto.ts`

- [ ] **Step 1: Create the DTO file**

```typescript
// src/core/clinical/visits/dto/visit-history-summary.dto.ts
export class VisitHistoryMedicationDto {
  name!: string;
  dose!: string;
}

export class VisitHistorySummaryDto {
  id!: string;
  appointment_type!: string;
  completed_at!: Date;
  diagnosis!: string | null;
  medications!: VisitHistoryMedicationDto[];
  investigations!: string[];
}
```

- [ ] **Step 2: Commit**

```bash
git add src/core/clinical/visits/dto/visit-history-summary.dto.ts
git commit -m "feat(visits): add VisitHistorySummaryDto for patient history endpoint"
```

---

## Task 2: Backend — Service method (TDD)

**Files:**
- Modify: `src/core/clinical/visits/visits.service.ts`
- Modify: `src/core/clinical/visits/visits.service.spec.ts`

- [ ] **Step 1: Write the failing test**

Add this `describe` block inside the outer `describe('VisitsService', ...)` in `visits.service.spec.ts`. The `db` object already has `visit.findMany` and `visit.count` as jest.fns — add the missing ones to the `db` mock object in `beforeEach`:

First, add `encounter` and `prescription` and `investigation` to the `db` type at the top of the `db` declaration (they are on `visit` via include so no separate table mock is needed — Prisma `include` is handled by `visit.findMany` returning the nested data).

Then add this describe block after the existing ones:

```typescript
describe('findPatientVisitHistory', () => {
  it('returns paginated completed visits with clinical summaries, excluding the current visit', async () => {
    const completedAt = new Date('2025-09-30T10:00:00Z');
    const mockHistoryVisit = {
      id: 'history-visit-uuid',
      appointment_type: 'VISIT',
      completed_at: completedAt,
      encounter: { provisional_diagnosis: 'Hypertension' },
      prescription: {
        items: [
          {
            medication: { name: 'Amlodipine' },
            custom_drug_name: null,
            dose: '5 mg',
          },
        ],
      },
      investigations: [
        { lab_test: { name: 'CBC' }, custom_test_name: null },
      ],
    };

    db.visit.findMany.mockResolvedValue([mockHistoryVisit]);
    db.visit.count.mockResolvedValue(1);
    db.$transaction.mockImplementation((queries: Promise<unknown>[]) =>
      Promise.all(queries),
    );

    const result = await service.findPatientVisitHistory(
      'patient-uuid',
      'org-uuid',
      { page: 1, limit: 3, excludeVisitId: 'current-visit-uuid' },
    );

    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toMatchObject({
      id: 'history-visit-uuid',
      appointment_type: 'VISIT',
      completed_at: completedAt,
      diagnosis: 'Hypertension',
      medications: [{ name: 'Amlodipine', dose: '5 mg' }],
      investigations: ['CBC'],
    });
    expect(result.meta.total).toBe(1);
    expect(result.meta.page).toBe(1);

    const [whereArg] = db.visit.findMany.mock.calls[0][0].where
      ? [db.visit.findMany.mock.calls[0][0]]
      : [{}];
    expect(db.visit.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'COMPLETED',
          id: { not: 'current-visit-uuid' },
        }),
      }),
    );
  });

  it('falls back to custom_drug_name when medication link is null', async () => {
    const mockVisitNoMed = {
      id: 'v2',
      appointment_type: 'FOLLOW_UP',
      completed_at: new Date(),
      encounter: null,
      prescription: {
        items: [
          {
            medication: null,
            custom_drug_name: 'Paracetamol',
            dose: '500 mg',
          },
        ],
      },
      investigations: [],
    };

    db.visit.findMany.mockResolvedValue([mockVisitNoMed]);
    db.visit.count.mockResolvedValue(1);
    db.$transaction.mockImplementation((queries: Promise<unknown>[]) =>
      Promise.all(queries),
    );

    const result = await service.findPatientVisitHistory(
      'patient-uuid',
      'org-uuid',
      { page: 1, limit: 3 },
    );

    expect(result.data[0].diagnosis).toBeNull();
    expect(result.data[0].medications).toEqual([
      { name: 'Paracetamol', dose: '500 mg' },
    ]);
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails**

```bash
npx jest src/core/clinical/visits/visits.service.spec.ts -t "findPatientVisitHistory" --no-coverage
```

Expected: `TypeError: service.findPatientVisitHistory is not a function`

- [ ] **Step 3: Implement `findPatientVisitHistory` in `visits.service.ts`**

Add this method to the `VisitsService` class (after `findAllForEpisode`):

```typescript
async findPatientVisitHistory(
  patientId: string,
  organizationId: string,
  query: { page?: number; limit?: number; excludeVisitId?: string },
) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 3;

  const where: Prisma.VisitWhereInput = {
    is_deleted: false,
    status: 'COMPLETED',
    episode: {
      journey: {
        patient_id: patientId,
        organization_id: organizationId,
      },
    },
    ...(query.excludeVisitId ? { id: { not: query.excludeVisitId } } : {}),
  };

  const [visits, total] = await this.prismaService.db.$transaction([
    this.prismaService.db.visit.findMany({
      where,
      orderBy: { completed_at: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        encounter: {
          select: { provisional_diagnosis: true },
        },
        prescription: {
          include: {
            items: {
              where: { is_deleted: false },
              orderBy: { order: 'asc' },
              include: {
                medication: { select: { name: true } },
              },
            },
          },
        },
        investigations: {
          where: { is_deleted: false },
          include: {
            lab_test: { select: { name: true } },
          },
        },
      },
    }),
    this.prismaService.db.visit.count({ where }),
  ]);

  const summaries = visits.map((v) => ({
    id: v.id,
    appointment_type: v.appointment_type,
    completed_at: v.completed_at!,
    diagnosis: v.encounter?.provisional_diagnosis ?? null,
    medications: (v.prescription?.items ?? []).map((item) => ({
      name: item.medication?.name ?? item.custom_drug_name ?? '',
      dose: item.dose,
    })),
    investigations: (v.investigations ?? [])
      .map((inv) => inv.lab_test?.name ?? inv.custom_test_name ?? '')
      .filter(Boolean),
  }));

  return paginated(summaries, { page, limit, total });
}
```

- [ ] **Step 4: Run the test to confirm it passes**

```bash
npx jest src/core/clinical/visits/visits.service.spec.ts -t "findPatientVisitHistory" --no-coverage
```

Expected: `PASS` — 2 tests passing

- [ ] **Step 5: Run full service spec to check no regressions**

```bash
npx jest src/core/clinical/visits/visits.service.spec.ts --no-coverage
```

Expected: all tests pass

- [ ] **Step 6: Commit**

```bash
git add src/core/clinical/visits/visits.service.ts src/core/clinical/visits/visits.service.spec.ts
git commit -m "feat(visits): add findPatientVisitHistory service method"
```

---

## Task 3: Backend — Controller route

**Files:**
- Modify: `src/core/clinical/visits/visits.controller.ts`

- [ ] **Step 1: Add `VisitHistoryQueryDto` and the route handler**

At the top of `visits.controller.ts`, add `IsUUID` to the class-validator imports:

```typescript
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
```

Add this DTO class after the existing query DTO classes (before the `@ApiTags` decorator):

```typescript
class VisitHistoryQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number = 3;
  @IsOptional() @IsUUID() exclude?: string;
}
```

Add this import at the top with the other DTO imports:

```typescript
import { VisitHistorySummaryDto } from './dto/visit-history-summary.dto';
```

Add this route handler inside the `VisitsController` class (e.g. after `findOne`):

```typescript
@Get('patients/:patientId/visits/history')
@ApiBearerAuth()
@ApiOperation({ summary: 'Paginated completed visit history for a patient' })
@ApiPaginatedResponse(VisitHistorySummaryDto)
findPatientVisitHistory(
  @Param('patientId', ParseUUIDPipe) patientId: string,
  @Query() query: VisitHistoryQueryDto,
  @CurrentUser() user: AuthContext,
) {
  return this.visitsService.findPatientVisitHistory(
    patientId,
    user.organizationId,
    { page: query.page, limit: query.limit, excludeVisitId: query.exclude },
  );
}
```

- [ ] **Step 2: Run lint to catch any issues**

```bash
npm run lint
```

Expected: no new errors

- [ ] **Step 3: Commit**

```bash
git add src/core/clinical/visits/visits.controller.ts
git commit -m "feat(visits): expose GET /patients/:patientId/visits/history endpoint"
```

---

## Task 4: Frontend — API types, fetch function, query key

**Files:**
- Modify: `src/features/visits/types/visits.api.types.ts`
- Modify: `src/features/visits/lib/visits.api.ts`
- Modify: `src/lib/queryKeys.ts`

- [ ] **Step 1: Add API types to `visits.api.types.ts`**

Add at the end of the file:

```typescript
export type ApiVisitHistoryMedication = {
  name: string;
  dose: string;
};

export type ApiVisitHistoryEntry = {
  id: string;
  appointment_type: "VISIT" | "FOLLOW_UP";
  completed_at: string;
  diagnosis: string | null;
  medications: ApiVisitHistoryMedication[];
  investigations: string[];
};

export type ApiVisitHistoryResponse = {
  data: ApiVisitHistoryEntry[];
  meta: ApiPaginationMeta;
};
```

- [ ] **Step 2: Add `fetchPatientVisitHistory` to `visits.api.ts`**

Add this import at the top alongside the other type imports:

```typescript
import type {
  // ...existing imports...
  ApiVisitHistoryResponse,
} from "../types/visits.api.types";
```

Add the fetch function in the `// ── reads ───` section:

```typescript
export function fetchPatientVisitHistory({
  patientId,
  page = 1,
  limit = 3,
  excludeVisitId,
}: {
  patientId: string;
  page?: number;
  limit?: number;
  excludeVisitId?: string;
}) {
  const search = new URLSearchParams();
  search.set("page", String(page));
  search.set("limit", String(limit));
  if (excludeVisitId) search.set("exclude", excludeVisitId);
  return apiAuthFetch<ApiVisitHistoryResponse>(
    `/patients/${patientId}/visits/history?${search.toString()}`,
  );
}
```

- [ ] **Step 3: Add `patientHistory` key to `queryKeys.ts`**

Inside the `visits` object, add after `byId`:

```typescript
patientHistory: (patientId: string, excludeVisitId: string) =>
  ["visits", "patient-history", patientId, excludeVisitId] as const,
```

- [ ] **Step 4: Commit**

```bash
git add src/features/visits/types/visits.api.types.ts src/features/visits/lib/visits.api.ts src/lib/queryKeys.ts
git commit -m "feat(visits): add patient visit history API types, fetch function, and query key"
```

---

## Task 5: Frontend — `usePatientVisitHistory` hook

**Files:**
- Create: `src/features/visits/hooks/usePatientVisitHistory.ts`

- [ ] **Step 1: Create the hook**

```typescript
// src/features/visits/hooks/usePatientVisitHistory.ts
"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { fetchPatientVisitHistory } from "../lib/visits.api";
import type { ApiVisitHistoryEntry } from "../types/visits.api.types";

export function usePatientVisitHistory({
  patientId,
  excludeVisitId,
}: {
  patientId: string;
  excludeVisitId: string;
}) {
  const query = useInfiniteQuery({
    queryKey: queryKeys.visits.patientHistory(patientId, excludeVisitId),
    queryFn: ({ pageParam }) =>
      fetchPatientVisitHistory({
        patientId,
        page: pageParam,
        limit: 3,
        excludeVisitId,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.flatMap((p) => p.data).length;
      return loaded < lastPage.meta.total ? allPages.length + 1 : undefined;
    },
  });

  const entries: ApiVisitHistoryEntry[] =
    query.data?.pages.flatMap((p) => p.data) ?? [];

  return {
    entries,
    isLoading: query.isLoading,
    isLoadingMore: query.isFetchingNextPage,
    hasMore: query.hasNextPage,
    loadMore: query.fetchNextPage,
  };
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
cd f:/Cradlen/cradlen-web && npx tsc --noEmit
```

Expected: no new errors

- [ ] **Step 3: Commit**

```bash
git add src/features/visits/hooks/usePatientVisitHistory.ts
git commit -m "feat(visits): add usePatientVisitHistory infinite-query hook"
```

---

## Task 6: Frontend — Update `VisitsHistoryList`

**Files:**
- Modify: `src/features/visits/components/visit-workspace/overview/VisitsHistoryList.tsx`

- [ ] **Step 1: Replace the entire file content**

```typescript
"use client";

import { Clock, Eye } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { usePatientVisitHistory } from "../../../hooks/usePatientVisitHistory";

type Props = {
  patientId: string;
  excludeVisitId: string;
};

function formatDate(iso: string, locale: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const formatLocale = locale.startsWith("en") ? "en-GB" : locale;
  return new Intl.DateTimeFormat(formatLocale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

function SkeletonCard({ isLast }: { isLast: boolean }) {
  return (
    <li className="flex items-stretch gap-4">
      <div className="flex w-24 flex-none flex-col items-center">
        <div className="h-3.5 w-20 animate-pulse rounded bg-gray-200" />
        {!isLast && (
          <div className="mt-2 w-px flex-1 bg-gray-200" aria-hidden="true" />
        )}
      </div>
      <div className={isLast ? "flex-1" : "flex-1 pb-6"}>
        <div className="space-y-3 rounded-xl border border-gray-100 p-4">
          <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
          <div className="h-3 w-40 animate-pulse rounded bg-gray-200" />
          <div className="h-3 w-32 animate-pulse rounded bg-gray-200" />
        </div>
      </div>
    </li>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-3">
      <h4 className="text-xs font-semibold text-brand-primary">{title}</h4>
      <div className="mt-1 space-y-0.5">{children}</div>
    </div>
  );
}

export function VisitsHistoryList({ patientId, excludeVisitId }: Props) {
  const t = useTranslations("visits.workspace.history");
  const locale = useLocale();
  const { entries, isLoading, isLoadingMore, hasMore, loadMore } =
    usePatientVisitHistory({ patientId, excludeVisitId });

  const mapped = entries.map((e) => ({
    id: e.id,
    date: e.completed_at,
    type: e.appointment_type,
    diagnoses: e.diagnosis ? [e.diagnosis] : [],
    medications: e.medications.map((m) => `${m.name} ${m.dose}`),
    investigations: e.investigations,
  }));

  return (
    <section>
      <header className="flex items-center gap-2">
        <Clock className="size-4 text-brand-primary" aria-hidden="true" />
        <h2 className="text-sm font-semibold text-brand-black">{t("title")}</h2>
      </header>

      <ol className="mt-6 space-y-0">
        {isLoading ? (
          <>
            <SkeletonCard isLast={false} />
            <SkeletonCard isLast={false} />
            <SkeletonCard isLast={true} />
          </>
        ) : mapped.length === 0 ? (
          <li className="py-6 text-center text-xs text-gray-500">
            {t("empty")}
          </li>
        ) : (
          mapped.map((entry, index) => {
            const isLast = index === mapped.length - 1 && !hasMore;
            return (
              <li key={entry.id} className="flex items-stretch gap-4">
                <div className="flex w-24 flex-none flex-col items-center">
                  <div className="flex items-center gap-1 text-xs font-medium text-gray-600 whitespace-nowrap">
                    <span>{formatDate(entry.date, locale)}</span>
                  </div>
                  {!isLast && (
                    <div
                      className="mt-2 w-px flex-1 bg-gray-200"
                      aria-hidden="true"
                    />
                  )}
                </div>

                <div className={isLast ? "flex-1" : "flex-1 pb-6"}>
                  <article className="rounded-xl border border-gray-100 p-4">
                    <header className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-medium text-gray-700">
                        {t(`typeLabel.${entry.type}`)}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                        <span
                          className="size-1.5 rounded-full bg-emerald-500"
                          aria-hidden="true"
                        />
                        {t("statusNormal")}
                      </span>
                      <a
                        href="#"
                        onClick={(e) => e.preventDefault()}
                        className="inline-flex items-center gap-1 text-xs font-medium text-brand-primary hover:text-brand-primary/80"
                      >
                        <Eye className="size-3.5" aria-hidden="true" />
                        {t("visitDetails")}
                      </a>
                    </header>

                    {entry.diagnoses.length > 0 && (
                      <Section title={t("diagnosis")}>
                        {entry.diagnoses.map((d) => (
                          <p key={d} className="text-xs text-gray-700">
                            {d}
                          </p>
                        ))}
                      </Section>
                    )}

                    {entry.medications.length > 0 && (
                      <Section title={t("medications")}>
                        <div className="flex flex-wrap gap-x-4 gap-y-1">
                          {entry.medications.map((m) => (
                            <span key={m} className="text-xs text-gray-700">
                              {m}
                            </span>
                          ))}
                        </div>
                      </Section>
                    )}

                    {entry.investigations.length > 0 && (
                      <Section title={t("investigations")}>
                        {entry.investigations.map((inv) => (
                          <p key={inv} className="text-xs text-gray-700">
                            {inv}
                          </p>
                        ))}
                      </Section>
                    )}
                  </article>
                </div>
              </li>
            );
          })
        )}
      </ol>

      {hasMore && (
        <div className="my-6 flex justify-center">
          <button
            type="button"
            onClick={() => loadMore()}
            disabled={isLoadingMore}
            className="inline-flex h-9 items-center justify-center rounded-full bg-brand-primary px-6 text-xs font-semibold text-white hover:bg-brand-primary/90 disabled:opacity-60"
          >
            {isLoadingMore ? t("loading") : t("loadMore")}
          </button>
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
cd f:/Cradlen/cradlen-web && npx tsc --noEmit
```

Expected: no new errors

- [ ] **Step 3: Commit**

```bash
git add src/features/visits/components/visit-workspace/overview/VisitsHistoryList.tsx
git commit -m "feat(visits): replace mock data in VisitsHistoryList with real paginated data"
```

---

## Task 7: Frontend — Wire `OverviewTab` + i18n

**Files:**
- Modify: `src/features/visits/components/visit-workspace/tabs/OverviewTab.tsx`
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`

- [ ] **Step 1: Update `OverviewTab` to pass props**

Change the `<VisitsHistoryList />` line from:

```tsx
<VisitsHistoryList />
```

to:

```tsx
<VisitsHistoryList
  patientId={visit.patient.id}
  excludeVisitId={visit.id}
/>
```

- [ ] **Step 2: Add i18n keys to `en.json`**

In `src/messages/en.json`, find the `"history"` namespace under `visits.workspace` (currently ends at line ~676). Add `"empty"` and `"loading"` inside it:

```json
"history": {
  "title": "Visits History",
  "loadMore": "Load more",
  "loading": "Loading...",
  "empty": "No previous visits found.",
  "visitDetails": "Visit Details",
  "diagnosis": "Diagnosis",
  "medications": "Medications",
  "investigations": "Investigations",
  "statusNormal": "Normal",
  "typeLabel": {
    "VISIT": "Visit",
    "FOLLOW_UP": "Follow-up"
  }
}
```

- [ ] **Step 3: Add i18n keys to `ar.json`**

In `src/messages/ar.json`, find the same `"history"` namespace (currently around line ~665). Add `"empty"` and `"loading"`:

```json
"history": {
  "title": "سجل الزيارات",
  "loadMore": "عرض المزيد",
  "loading": "جارٍ التحميل...",
  "empty": "لا توجد زيارات سابقة.",
  "visitDetails": "تفاصيل الزيارة",
  "diagnosis": "التشخيص",
  "medications": "الأدوية",
  "investigations": "الفحوصات",
  "statusNormal": "طبيعي",
  "typeLabel": {
    "VISIT": "زيارة",
    "FOLLOW_UP": "متابعة"
  }
}
```

- [ ] **Step 4: Run TypeScript check and lint**

```bash
cd f:/Cradlen/cradlen-web && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add src/features/visits/components/visit-workspace/tabs/OverviewTab.tsx src/messages/en.json src/messages/ar.json
git commit -m "feat(visits): wire VisitsHistoryList to real data, add empty/loading i18n keys"
```

---

## Verification

1. Start the dev server (`npm run start:dev` in api, `npm run dev` in web).
2. Open a visit workspace for a patient who has past completed visits → timeline shows real entries, newest first, 3 per page.
3. Click "Load More" → next 3 append below the existing entries; button hides when all visits are loaded.
4. Open a workspace for a patient with no completed visits → empty state "No previous visits found." is shown.
5. Confirm the current visit does not appear in the timeline.
6. Run `npx jest src/core/clinical/visits/visits.service.spec.ts --no-coverage` → all tests pass.
7. Run `npm run lint` in the API → no new errors.
8. Run `npx tsc --noEmit` in the web → no new errors.