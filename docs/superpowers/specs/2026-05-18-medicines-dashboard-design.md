# Medicines Dashboard — Design Spec

**Date:** 2026-05-18  
**Status:** Approved

---

## Context

The Cradlen dashboard needs a Medicines catalog page so clinic staff can manage the organization's medication list — adding new drugs, editing existing ones, and removing those no longer used. The page sits under `dashboard/medications` and appears as **Medicines** in the sidebar nav. It follows the same visual language and component patterns as the rest of the dashboard (Staff, Patients, etc.).

---

## Design Goals

- Let users browse, search, and filter the medication catalog at a glance.
- Add and edit medications through a right-side drawer without leaving the page.
- Delete medications with a simple confirmation dialog.
- Render all fields from the design mockup; placeholder fields (not yet in API) are shown as disabled UI elements so the layout is future-ready.

---

## Page URL

```
/[locale]/[orgId]/[branchId]/dashboard/medications
```

---

## Module Location

```
src/features/medications/
├── components/
│   ├── MedicationsPage.tsx       ← main container (state, layout)
│   ├── MedicationsTable.tsx      ← table with hover row actions
│   ├── MedicationDrawer.tsx      ← add / edit right-side sheet
│   └── DeleteMedicationDialog.tsx
├── hooks/
│   ├── useMedications.ts         ← list query
│   └── useManageMedications.ts   ← create / update / delete mutations
├── lib/
│   ├── medications.api.ts        ← raw fetch functions (apiAuthFetch)
│   └── medications.schemas.ts    ← Zod form schemas
├── types/
│   └── medications.types.ts
└── messages/
    ├── en.json
    └── ar.json
```

> Placed in `src/features/medications/` (legacy-allowed path) to keep the migration surface small. Promote to `src/core/medications/` in a later phase.

---

## Table

### Columns

| Column | Source | Notes |
|---|---|---|
| Name | `name` | Primary text; `generic_name` stacked below in muted gray |
| Form | `form` | e.g. Tablet, Capsule, Injection |
| Strength | `strength` | e.g. 500 mg, 10 IU/ml |
| Category | — | **UI placeholder** — rendered as "—" / disabled badge until API adds field |
| Default Dose | — | **UI placeholder** — rendered as "—" until API adds field |
| Usage | `total_prescriptions` | Integer count |
| Notes | — | **UI placeholder** — rendered as "—" until API adds field |
| Actions | — | Edit ✏ + Delete 🗑 icon buttons, visible on row hover only |

### Row actions

Edit and Delete icon buttons (`opacity-0 group-hover:opacity-100`) appear on hover per row. Clicking Edit opens the drawer pre-filled; clicking Delete opens the confirmation dialog. No row selection or side panel needed.

### Filters & Search

- **Category** dropdown (UI placeholder — disabled, shows "Category ↓" but does nothing yet)
- **Form** dropdown — filters client-side (or passes `form` query param when API supports it; for now filter client-side from the fetched list)
- **Search** text input — passes `search` query param to `GET /v1/medications`

### Pagination

Server-side. `page` / `limit` query params (default limit = 10). Shows "show N of M results" and numbered page buttons matching the mockup style.

---

## Drawer (Add / Edit)

Right-side sheet (`fixed inset-y-0 inset-e-0 w-[480px]`), implemented with `Dialog.Root` from `radix-ui` (same pattern as `StaffCreateDrawer`).

### Header

- Breadcrumb title: **Medicines / New Medicine** (add mode) or **Medicines / Edit Medicine** (edit mode)
- Close button (✕) top-right
- Metadata row: **Doctor** (added-by profile name) · **Added on** (formatted `created_at`) — read-only, shown in edit mode; in add mode shows current user + "now"

### Form fields

| Field | Maps to | Required | State |
|---|---|---|---|
| Medicine | `code` | ✅ | Active |
| Name | `name` | ✅ | Active |
| Category | — | — | **Disabled placeholder** |
| Form | `form` | — | Active (free text input) |
| Strength | `strength` | — | Active (free text input) |
| Default Dose | — | — | **Disabled placeholder** |
| Medical Rep | `medical_reps[0]` (display name) | — | **Disabled placeholder** (API returns linked reps but linking is a separate operation not in `POST`/`PATCH`) |
| Assigned To | — | — | **Disabled placeholder** |
| Company | — | — | **Disabled placeholder** |
| Notes | — | — | **Disabled placeholder** |

Disabled placeholder fields render as a normal input/select visually but have `disabled` + a `title="Coming soon"` tooltip. They do NOT submit any value.

### Validation (Zod)

```ts
z.object({
  code: z.string().min(1).max(64),
  name: z.string().min(1).max(200),
  generic_name: z.string().max(200).optional(),
  form: z.string().max(64).optional(),
  strength: z.string().max(64).optional(),
})
```

### Footer

Cancel button (outline) + **Save** button (brand-primary). Save is disabled while mutation is pending.

---

## Delete Confirmation Dialog

`AlertDialog.Root` (radix-ui). Simple — no typed-name confirmation required (medications are catalog data, not sensitive accounts).

- **Title:** Delete {name}?
- **Body:** "This will remove **{name}** from your catalog. This action cannot be undone."
- **Buttons:** Cancel (outline) · Delete (red destructive)
- Mutation: `DELETE /v1/medications/:id` → 204

---

## API Endpoints Used

| Action | Endpoint | Notes |
|---|---|---|
| List | `GET /v1/medications?page=&limit=&search=` | Paginated |
| Create | `POST /v1/medications` | Body: code, name, generic_name, form, strength |
| Update | `PATCH /v1/medications/:id` | Body: name, generic_name, form, strength (code not updatable) |
| Delete | `DELETE /v1/medications/:id` | Soft delete, 204 response |

Auth injected automatically by `apiAuthFetch`. Organization scope is applied server-side from the auth token — no explicit `org_id` in URL.

---

## State Management

All state lives in `MedicationsPage` (no Zustand store needed):

```ts
const [search, setSearch] = useState("");
const [formFilter, setFormFilter] = useState<string | null>(null);
const [page, setPage] = useState(1);
const [drawerMode, setDrawerMode] = useState<"add" | "edit" | null>(null);
const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
const [deletingMedication, setDeletingMedication] = useState<Medication | null>(null);
```

---

## Query Keys

```ts
// src/features/medications/lib/medications.queryKeys.ts
export const medicationQueryKeys = {
  all: () => ["medications"] as const,
  list: (params) => ["medications", "list", params] as const,
};
```

On create/update/delete success: `invalidateQueries({ queryKey: medicationQueryKeys.all() })`.

---

## i18n

Translation namespaces: `medications` (table, toolbar, page header) and `medications.drawer` (form labels). Keys follow the same structure as `src/core/staff/messages/`.

Both `en.json` and `ar.json` required. RTL layout handled automatically by Tailwind logical properties (`ms-`, `me-`, `ps-`, `pe-`).

---

## App Route

New file: `src/app/[locale]/[orgId]/[branchId]/dashboard/medications/page.tsx`

```tsx
// server component — sets locale, renders MedicationsPage client component
import { setRequestLocale } from "next-intl/server";
import MedicationsPage from "@/features/medications/components/MedicationsPage";

export default async function Page({ params }) {
  const { locale, orgId, branchId } = await params;
  setRequestLocale(locale);
  return <MedicationsPage orgId={orgId} branchId={branchId} />;
}
```

---

## Placeholder Field Strategy

Fields not yet in the API render as visually-complete but non-interactive inputs with:
- `disabled` attribute
- `cursor-not-allowed opacity-60` classes
- `title="Coming soon"` for tooltip

They submit no data. When the API adds these fields, remove `disabled`, wire up the form key, and add to the Zod schema — no structural refactor needed.

---

## Verification

1. `npm run dev` — navigate to `/en/{orgId}/{branchId}/dashboard/medications`
2. Table loads with real data from `GET /v1/medications`
3. Search input debounces and re-fetches
4. Form filter narrows results client-side
5. "+ New Medicine" opens drawer; filling Code + Name and clicking Save calls `POST` and table refreshes
6. Row hover shows edit/delete icons; Edit opens drawer pre-filled; Update calls `PATCH`
7. Delete icon opens confirmation; confirming calls `DELETE` and row disappears
8. Placeholder fields (Category, Default Dose, etc.) are visible but disabled
9. `npm run lint && npm run build` — no errors
