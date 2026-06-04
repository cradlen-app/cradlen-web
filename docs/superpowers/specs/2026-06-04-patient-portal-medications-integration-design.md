# Patient Portal — Medications live-data integration

**Date:** 2026-06-04
**Status:** Approved (design)
**Repo:** `cradlen-web` (frontend). Backend endpoint lives in `cradlen-api`.

## Context

The patient portal UI (`src/core/patient-portal/`) is fully built but reads from
in-memory fixtures through one documented swap point:
`data/patient-portal.api.ts`. The backend now exposes the first patient-scoped
read endpoint — `GET /v1/patient-portal/medications` — returning the signed-in
patient's prescriptions split into `current` / `past`. This spec wires the
**Medications** screen (and the Home `MedicationsPreview`, which reuses the same
hook) to that endpoint. Every other portal screen stays on fixtures; their
backends don't exist yet.

No UI/markup changes: `MedicationsScreen`, `MedicationsPreview`, and the card
already render the `PortalMedication` view model. We only change where the data
comes from.

### Verified backend facts

- `GET /v1/patient-portal/medications?patient_id=<uuid?>` → wrapped
  `{ data: { current: Item[]; past: Item[] }, meta: {} }`. `patient_id` is
  optional and validated against the caller's accessible set; omitting it
  returns the whole accessible set.
- Each `Item` (backend `PatientMedicationItemDto`): `id`, `name`,
  `generic_name?`, `strength?`, `form?`, `category?`, `dose`, `frequency`,
  `duration?`, `instructions?`, `route?`, `visit_date`, `prescribed_at`,
  `end_date?`, `is_current`, `doctor_name?` (already `"Dr. <first> <last>"`),
  `clinic_name?`.
- `GET /v1/patient-auth/me` returns `patient_id`, `guardian_id`,
  `accessible_patient_ids: string[]`, `display_name`, and
  `accessible_patients: { id, full_name, date_of_birth, relation }[]`.
- The patient session is cookie-based; patient-scoped calls go through a Next
  route handler that injects the patient access token
  (`getValidPatientAccessToken` + `backendFetch`), mirroring
  `app/api/patient-auth/me/route.ts`.

## Design

### 1. Transport — new Next route handler

`src/app/api/patient-portal/medications/route.ts` (`GET`), mirroring
`app/api/patient-auth/me/route.ts`:

- `getValidPatientAccessToken()` → `401 { message }` + `clearPatientAuthCookies`
  when no token.
- Forward the request's `?patient_id=` search string to
  `backendFetch("/patient-portal/medications" + search, { headers: { Authorization: \`Bearer ${accessToken}\` } })`.
- `setPatientAuthCookies` when tokens rotated; `clearPatientAuthCookies` on a
  backend 401. Pass the wrapped body straight through with the backend status.

### 2. FE DTO types + mapper

`src/core/patient-portal/data/patient-medications.api.types.ts`
- `ApiPatientMedicationItem` — mirrors the backend `PatientMedicationItemDto`.
- `ApiPatientMedicationsResponse` — `{ data: { current: ApiPatientMedicationItem[]; past: ApiPatientMedicationItem[] }; meta: Record<string, unknown> }`.

`src/core/patient-portal/lib/map-medication.ts` —
`mapApiMedication(item, status: MedicationStatus): PortalMedication`:
- Passthrough: `id`, `name`, `dose`, `frequency`; `genericName ← generic_name`;
  `prescriberName ← doctor_name ?? ""`; `endDate ← end_date`.
- `clinic ← { id: clinic_name ?? "", name: clinic_name ?? "" }` (backend has only
  a name; no city).
- `startDate ← visit_date` (the "visit date" the card shows).
- `status` ← the bucket the item came from (`"active"` | `"past"`).
- `form ← mapForm(item.form)`: lowercase, match the six `MedicationForm`
  values, else `"other"`. Undefined input → undefined (icon falls back).
- `drugClass ← mapClass(item.category)`: lowercase, match the five
  `MedicationClass` values, else `undefined` (no class label rendered).
- `daysLeft` (active only): `ceil((end_date − todayStart) / day)` when `end_date`
  present and in the future; otherwise omitted.
- Structured fields (`amountPerDose`, `intervalHours`, `foodTiming`,
  `courseDays`) are intentionally left **undefined** — the card already renders
  `dose · frequency` when they are absent. No fragile free-text parsing of
  `duration`/`frequency`.

### 3. Swap point — `data/patient-portal.api.ts`

Replace only the body of `fetchMedications(patientId: string)` (signature
unchanged) with:

```ts
const qs = patientId ? `?patient_id=${encodeURIComponent(patientId)}` : "";
const res = await apiFetch<ApiPatientMedicationsResponse>(
  `/api/patient-portal/medications${qs}`,
);
return [
  ...res.data.current.map((m) => mapApiMedication(m, "active")),
  ...res.data.past.map((m) => mapApiMedication(m, "past")),
];
```

All other `fetch*` functions stay fixture-backed.

### 4. Real patient-id resolution — `hooks/usePortalData.ts`

`usePatientMe()` is already fetched on every portal page (in `PatientNavbar`,
as the session gate), so the identity is in the React Query cache under
`patientPortalQueryKeys.me()`. To respect the module boundary (core must not
import `features/auth`), add a small core-local reader:

`usePatientIdentity()` — `useQuery({ queryKey: patientPortalQueryKeys.me(), enabled: false })`
typed with a minimal local interface
`{ patient_id: string | null; accessible_patient_ids: string[] }`. It subscribes
to the cache entry the navbar populates; no second fetch, no queryFn.

`useMedications()` resolves the scoping id from identity (not the fixture
`useActivePatientId`, so the other fixture screens are untouched):

```ts
const { data: identity } = usePatientIdentity();
const activeFixtureId = useActivePatientId();
const accessible = identity?.accessible_patient_ids ?? [];
const patientId = accessible.includes(activeFixtureId)
  ? activeFixtureId
  : (identity?.patient_id ?? accessible[0]);

return useQuery({
  queryKey: patientPortalQueryKeys.medications(patientId ?? "none"),
  queryFn: () => fetchMedications(patientId!),
  enabled: Boolean(patientId),
});
```

- **Today** (fixture profile list): always resolves to the account holder's real
  `patient_id` → no 404.
- **Guardian account** (`patient_id` null): resolves to the first accessible
  dependent.
- **Forward-compatible**: once the profile switcher uses real
  `accessible_patients` ids, selecting a dependent scopes correctly with zero
  further change (the id flows straight to `patient_id`).

The other fixture hooks keep using `useActivePatientId()` and their mock data.

## Out of scope

- The in-progress navbar/switcher work that surfaces `display_name` /
  `accessible_patients` (separate uncommitted change — left untouched).
- Wiring the other portal screens (record, tests, documents, appointments) to
  real endpoints — those backends don't exist yet.

## Verification

- `npm run build` and `npm run lint` clean.
- Unit test `lib/map-medication.test.ts`: form/class mapping (known, unknown,
  undefined), clinic-from-name, status from bucket, `daysLeft` computation, and
  that the structured free-text-fallback fields stay undefined.
- Manual: sign in as a patient → Medications shows live `current` / `past`
  buckets with doctor, clinic, and visit date; Home preview shows the first
  active meds.
