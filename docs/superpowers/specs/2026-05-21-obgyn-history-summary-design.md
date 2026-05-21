# OB/GYN History Summary — Design Spec

**Date:** 2026-05-21
**Status:** Approved
**Author:** ibrahem abodeif

---

## Context

Doctors currently have 3 tabs when opening a visit: Overview, History, and Examination. The Overview tab already shows patient demographics and visit timeline. This spec adds a **compact history summary** section to the Overview tab — a single API call that returns the clinically critical highlights a doctor needs for an at-a-glance mental model before or during a consult.

The feature is OB/GYN-first but establishes a URL pattern and folder convention that all future specialties (pediatrics, cardiology, etc.) will follow.

---

## Endpoint

```http
GET /v1/patients/:patientId/obgyn-history-summary
```

- Authentication: Bearer token (JwtAuthGuard — global default)
- Authorization: `PatientAccessService.assertCanAccessPatient(patientId, user)` — same guard used by allergies, medications, and notes endpoints

---

## Location in Codebase

New subfolder inside the existing OB/GYN specialty module:

```text
src/specialties/obgyn/history-summary/
├── history-summary.controller.ts
├── history-summary.service.ts
└── dto/
    └── obgyn-history-summary.dto.ts
```

Controller is registered inside the existing `ObgynModule` — no new module needed.

---

## Response DTO — `ObgynHistorySummaryDto`

```ts
{
  history_exists: boolean  // false = no PatientObgynHistory row yet; UI shows "No history recorded"

  // Critical safety signals — rendered first in UI
  allergies: {
    allergy_to: string
    severity: string
    associated_symptoms: string
  }[]

  // Active medications only (is_ongoing: true)
  current_medications: {
    drug_name: string
    dose: string
    frequency: string
    is_ongoing: boolean
  }[]

  // Obstetric snapshot (cached G/P/A from PatientObgynHistory)
  obstetric_summary: {
    gravida: number
    para: number
    abortion: number
    ectopic: number
    stillbirths: number
  } | null

  // Gynecological baseline
  gynecological_baseline: {
    age_at_menarche: number
    cycle_regularity: string
    dysmenorrhea: boolean
  } | null

  // Chronic background
  chronic_illnesses: { items: string[]; notes: string } | null
  family_history: { gynecologic_cancers: string[]; chronic_illnesses: string[] } | null
  social_history: { smoking: string; alcohol: string } | null

  // Screening currency
  screening_status: {
    pap_smear: string
    pap_smear_date: string
    mammography: string
    mammography_date: string
  } | null

  // Per-section last-modified timestamps — UI uses for "last updated X ago" badges
  section_timestamps: Record<string, string> | null
}
```

---

## Service Logic

```text
getObgynHistorySummary(patientId: string, user: AuthContext):

1. PatientAccessService.assertCanAccessPatient(patientId, user)
   → 403 if org has no access to this patient
   → 404 if patient not found

2. prisma.db.patientObgynHistory.findUnique({
     where: { patient_id: patientId, is_deleted: false },
     select: {
       obstetric_summary, gynecological_baseline,
       medical_chronic_illnesses, family_history,
       social_history, screening_history, section_timestamps,
       allergies:   { where: { is_deleted: false } },
       medications: { where: { is_deleted: false, is_ongoing: true } }
     }
   })

3. null result → return { history_exists: false, all other fields null }

4. Map columns to DTO → return { history_exists: true, ...fields }
```

**Key decisions:**

- `select` (not `include`) — excludes audit columns (`version`, `updated_by_id`, timestamps) from the response
- `medications` filtered to `is_ongoing: true` — doctors need current meds only
- No caching layer — query is a single indexed lookup on `patient_id`; `section_timestamps` in the response lets the frontend handle staleness display
- No sorting/pagination — allergies are a small set; no additional per-field annotations surfaced

---

## Error Cases

| Condition | Response |
|-----------|----------|
| Patient not found | 404 (thrown by `PatientAccessService`) |
| Org has no access to patient | 403 (thrown by `PatientAccessService`) |
| No OB/GYN history row exists | 200 with `history_exists: false` |

---

## Extensibility Contract

URL pattern: `GET /v1/patients/:patientId/{specialty}-history-summary`

Each future specialty:

- Creates `src/specialties/{specialty}/history-summary/` with the same 3-file structure
- Owns its own DTO (no forced shared base class — specialty shapes differ too much)
- Uses the same `PatientAccessService.assertCanAccessPatient` authorization entry point
- Returns `history_exists: boolean` and `section_timestamps` in its response envelope
- Registers its controller inside its own specialty module

No abstract base class or generic factory is introduced until 2+ specialties exist.

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/specialties/obgyn/history-summary/history-summary.controller.ts` | GET endpoint, Swagger decorators |
| `src/specialties/obgyn/history-summary/history-summary.service.ts` | Aggregation logic |
| `src/specialties/obgyn/history-summary/dto/obgyn-history-summary.dto.ts` | Response DTO |
| `src/specialties/obgyn/history-summary/history-summary.service.spec.ts` | Unit tests |

## Files to Modify

| File | Change |
|------|--------|
| `src/specialties/obgyn/obgyn.module.ts` | Register `HistorySummaryController` and `HistorySummaryService` |

---

## Verification

### Unit Tests (`history-summary.service.spec.ts`)

- Patient with full history → all fields populated, `history_exists: true`
- Patient with no OB/GYN history row → all fields null, `history_exists: false`
- Patient with history but no allergies/medications → empty arrays, summary fields present
- `is_ongoing: false` medications excluded from `current_medications`
- Soft-deleted allergies excluded
- `PatientAccessService.assertCanAccessPatient` called with correct args

### Manual / Integration

1. Seed demo data: `npm run seed:fixtures`
2. Login + select profile → get `access_token`
3. `GET /v1/patients/:patientId/obgyn-history-summary` — verify `history_exists: false` for fresh patient
4. `PATCH` OB/GYN history via existing endpoint → re-fetch summary → confirm fields and `section_timestamps` update
5. Add allergy + ongoing medication → re-fetch → confirm they appear
6. Mark medication `is_ongoing: false` → re-fetch → confirm it drops out
7. Call with token from a different org with no patient access → confirm 403