# Medicines Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Medicines catalog page at `/dashboard/medicine` with a data table, right-side add/edit drawer, and delete confirmation dialog.

**Architecture:** Feature module at `src/features/medications/` with plain HTML table, `radix-ui` Dialog/AlertDialog for drawer and delete confirmation, TanStack Query for data fetching, and React Hook Form + Zod for the form. Sidebar nav and route-access guard are already wired for `/medicine` — no changes needed there.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, TanStack Query v5, React Hook Form, Zod v4, radix-ui, next-intl, Lucide React, Sonner (toasts)

---

## File Map

| Action | Path | Purpose |
|---|---|---|
| Create | `src/features/medications/types/medications.types.ts` | Domain types |
| Create | `src/features/medications/lib/medications.queryKeys.ts` | TanStack Query key factory |
| Create | `src/features/medications/lib/medications.schemas.ts` | Zod form schema |
| Create | `src/features/medications/lib/medications.schemas.test.ts` | Schema unit tests |
| Create | `src/features/medications/lib/medications.api.ts` | Raw fetch functions |
| Create | `src/features/medications/hooks/useMedications.ts` | List query hook |
| Create | `src/features/medications/hooks/useManageMedications.ts` | Create/update/delete mutation hooks |
| Create | `src/features/medications/components/MedicationsTable.tsx` | Table with hover row actions |
| Create | `src/features/medications/components/MedicationDrawer.tsx` | Add/edit right-side sheet |
| Create | `src/features/medications/components/DeleteMedicationDialog.tsx` | Delete confirmation |
| Create | `src/features/medications/components/MedicationsPage.tsx` | Page container (all state lives here) |
| Create | `src/app/[locale]/[orgId]/[branchId]/dashboard/medicine/page.tsx` | Next.js route page |
| Modify | `src/messages/en.json` | Add `medications` translation namespace |
| Modify | `src/messages/ar.json` | Add `medications` translation namespace (Arabic) |

---

## Task 1: Types and Query Key Factory

**Files:**
- Create: `src/features/medications/types/medications.types.ts`
- Create: `src/features/medications/lib/medications.queryKeys.ts`

- [ ] **Step 1: Create types file**

```typescript
// src/features/medications/types/medications.types.ts
export interface Medication {
  id: string;
  organization_id: string | null;
  code: string;
  name: string;
  generic_name: string | null;
  form: string | null;
  strength: string | null;
  added_by_id: string | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  total_prescriptions: number;
  top_prescribers: Array<{
    profile_id: string;
    full_name: string;
    count: number;
  }>;
  medical_reps: Array<{
    id: string;
    full_name: string;
    company_name: string;
  }>;
}

export interface MedicationListMeta {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export interface MedicationListResponse {
  data: Medication[];
  meta: MedicationListMeta;
}

export interface CreateMedicationRequest {
  code: string;
  name: string;
  generic_name?: string;
  form?: string;
  strength?: string;
}

export interface UpdateMedicationRequest {
  name?: string;
  generic_name?: string;
  form?: string;
  strength?: string;
}
```

- [ ] **Step 2: Create query key factory**

```typescript
// src/features/medications/lib/medications.queryKeys.ts
export interface MedicationsListParams {
  page: number;
  limit: number;
  search: string;
}

export const medicationQueryKeys = {
  all: () => ["medications"] as const,
  list: (params: MedicationsListParams) =>
    ["medications", "list", params] as const,
} as const;
```

- [ ] **Step 3: Commit**

```bash
git add src/features/medications/types/medications.types.ts src/features/medications/lib/medications.queryKeys.ts
git commit -m "feat(medications): add domain types and query key factory"
```

---

## Task 2: Zod Schema with Tests

**Files:**
- Create: `src/features/medications/lib/medications.schemas.ts`
- Create: `src/features/medications/lib/medications.schemas.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/features/medications/lib/medications.schemas.test.ts
import { describe, it, expect } from "vitest";
import { medicationFormSchema } from "./medications.schemas";

describe("medicationFormSchema", () => {
  it("accepts valid full data", () => {
    const result = medicationFormSchema.safeParse({
      code: "AMX-500",
      name: "Amoxicillin",
      form: "Capsule",
      strength: "500mg",
    });
    expect(result.success).toBe(true);
  });

  it("accepts minimal required fields only", () => {
    const result = medicationFormSchema.safeParse({ code: "X", name: "Y" });
    expect(result.success).toBe(true);
  });

  it("accepts empty strings for optional fields", () => {
    const result = medicationFormSchema.safeParse({
      code: "IBU-400",
      name: "Ibuprofen",
      form: "",
      strength: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty code", () => {
    const result = medicationFormSchema.safeParse({ code: "", name: "Amoxicillin" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toContain("code");
  });

  it("rejects empty name", () => {
    const result = medicationFormSchema.safeParse({ code: "AMX", name: "" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toContain("name");
  });

  it("rejects code exceeding 64 characters", () => {
    const result = medicationFormSchema.safeParse({
      code: "A".repeat(65),
      name: "Test",
    });
    expect(result.success).toBe(false);
  });

  it("rejects name exceeding 200 characters", () => {
    const result = medicationFormSchema.safeParse({
      code: "X",
      name: "A".repeat(201),
    });
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/features/medications/lib/medications.schemas.test.ts
```

Expected: FAIL with "Cannot find module"

- [ ] **Step 3: Implement the schema**

```typescript
// src/features/medications/lib/medications.schemas.ts
import { z } from "zod";

export const medicationFormSchema = z.object({
  code: z.string().min(1, "Code is required").max(64),
  name: z.string().min(1, "Name is required").max(200),
  form: z.string().max(64),
  strength: z.string().max(64),
});

export type MedicationFormValues = z.infer<typeof medicationFormSchema>;
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/features/medications/lib/medications.schemas.test.ts
```

Expected: 7 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/medications/lib/medications.schemas.ts src/features/medications/lib/medications.schemas.test.ts
git commit -m "feat(medications): add Zod form schema with unit tests"
```

---

## Task 3: API Fetch Functions

**Files:**
- Create: `src/features/medications/lib/medications.api.ts`

- [ ] **Step 1: Create API module**

```typescript
// src/features/medications/lib/medications.api.ts
import { apiAuthFetch } from "@/infrastructure/http/api";
import type {
  Medication,
  MedicationListResponse,
  CreateMedicationRequest,
  UpdateMedicationRequest,
} from "../types/medications.types";
import type { MedicationsListParams } from "./medications.queryKeys";

export function fetchMedications({ page, limit, search }: MedicationsListParams) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (search.trim()) params.set("search", search.trim());
  return apiAuthFetch<MedicationListResponse>(`/medications?${params}`);
}

export function createMedication(data: CreateMedicationRequest) {
  return apiAuthFetch<Medication>("/medications", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateMedication(id: string, data: UpdateMedicationRequest) {
  return apiAuthFetch<Medication>(`/medications/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteMedication(id: string) {
  return apiAuthFetch<void>(`/medications/${id}`, { method: "DELETE" });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/medications/lib/medications.api.ts
git commit -m "feat(medications): add API fetch functions"
```

---

## Task 4: React Query Hooks

**Files:**
- Create: `src/features/medications/hooks/useMedications.ts`
- Create: `src/features/medications/hooks/useManageMedications.ts`

- [ ] **Step 1: Create list query hook**

```typescript
// src/features/medications/hooks/useMedications.ts
import { useQuery } from "@tanstack/react-query";
import { medicationQueryKeys } from "../lib/medications.queryKeys";
import { fetchMedications } from "../lib/medications.api";
import type { MedicationsListParams } from "../lib/medications.queryKeys";

export function useMedications(params: MedicationsListParams) {
  return useQuery({
    queryKey: medicationQueryKeys.list(params),
    queryFn: () => fetchMedications(params),
  });
}
```

- [ ] **Step 2: Create mutation hooks**

```typescript
// src/features/medications/hooks/useManageMedications.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/common/errors/error";
import { medicationQueryKeys } from "../lib/medications.queryKeys";
import {
  createMedication,
  updateMedication,
  deleteMedication,
} from "../lib/medications.api";
import type { CreateMedicationRequest, UpdateMedicationRequest } from "../types/medications.types";

export function useCreateMedication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMedicationRequest) => createMedication(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: medicationQueryKeys.all() });
      toast.success("Medication added successfully");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to add medication"));
    },
  });
}

export function useUpdateMedication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMedicationRequest }) =>
      updateMedication(id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: medicationQueryKeys.all() });
      toast.success("Medication updated successfully");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to update medication"));
    },
  });
}

export function useDeleteMedication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteMedication(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: medicationQueryKeys.all() });
      toast.success("Medication deleted");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to delete medication"));
    },
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add src/features/medications/hooks/useMedications.ts src/features/medications/hooks/useManageMedications.ts
git commit -m "feat(medications): add TanStack Query hooks"
```

---

## Task 5: Translation Keys

**Files:**
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`

- [ ] **Step 1: Add English translations**

Open `src/messages/en.json` and add a top-level `"medications"` key (anywhere at the root level):

```json
"medications": {
  "title": "Medicines",
  "subtitle": "Manage your organization's medication catalog",
  "addButton": "New Medicine",
  "searchPlaceholder": "Search by name, code…",
  "filters": {
    "category": "Category",
    "form": "Form",
    "comingSoon": "Coming soon"
  },
  "table": {
    "columns": {
      "name": "Name",
      "form": "Form",
      "strength": "Strength",
      "category": "Category",
      "defaultDose": "Default Dose",
      "usage": "Usage",
      "notes": "Notes"
    },
    "empty": "No medications found",
    "showing": "Showing {from}–{to} of {total} medications"
  },
  "actions": {
    "edit": "Edit medication",
    "delete": "Delete medication"
  },
  "drawer": {
    "addTitle": "New Medicine",
    "editTitle": "Edit Medicine",
    "breadcrumb": "Medicines",
    "fields": {
      "medicine": "Medicine",
      "medicinePlaceholder": "e.g. AMX-500",
      "name": "Name",
      "namePlaceholder": "e.g. Amoxicillin",
      "category": "Category",
      "form": "Form",
      "formPlaceholder": "e.g. Tablet",
      "strength": "Strength",
      "strengthPlaceholder": "e.g. 500mg",
      "defaultDose": "Default Dose",
      "medicalRep": "Medical Rep",
      "assignedTo": "Assigned To",
      "company": "Company",
      "notes": "Notes",
      "comingSoon": "Coming soon",
      "optional": "optional"
    },
    "saveButton": "Save",
    "cancel": "Cancel"
  },
  "delete": {
    "title": "Delete {name}?",
    "description": "This will remove {name} from your catalog. This action cannot be undone.",
    "confirm": "Delete",
    "cancel": "Cancel"
  }
}
```

- [ ] **Step 2: Add Arabic translations**

Open `src/messages/ar.json` and add the same `"medications"` key with Arabic values:

```json
"medications": {
  "title": "الأدوية",
  "subtitle": "إدارة قائمة الأدوية في مؤسستك",
  "addButton": "دواء جديد",
  "searchPlaceholder": "ابحث بالاسم أو الكود…",
  "filters": {
    "category": "الفئة",
    "form": "الشكل",
    "comingSoon": "قريباً"
  },
  "table": {
    "columns": {
      "name": "الاسم",
      "form": "الشكل",
      "strength": "التركيز",
      "category": "الفئة",
      "defaultDose": "الجرعة الافتراضية",
      "usage": "الاستخدام",
      "notes": "ملاحظات"
    },
    "empty": "لا توجد أدوية",
    "showing": "عرض {from}–{to} من {total} دواء"
  },
  "actions": {
    "edit": "تعديل الدواء",
    "delete": "حذف الدواء"
  },
  "drawer": {
    "addTitle": "دواء جديد",
    "editTitle": "تعديل الدواء",
    "breadcrumb": "الأدوية",
    "fields": {
      "medicine": "الدواء",
      "medicinePlaceholder": "مثال: AMX-500",
      "name": "الاسم",
      "namePlaceholder": "مثال: أموكسيسيلين",
      "category": "الفئة",
      "form": "الشكل",
      "formPlaceholder": "مثال: أقراص",
      "strength": "التركيز",
      "strengthPlaceholder": "مثال: 500 مج",
      "defaultDose": "الجرعة الافتراضية",
      "medicalRep": "المندوب الطبي",
      "assignedTo": "مُسند إلى",
      "company": "الشركة",
      "notes": "ملاحظات",
      "comingSoon": "قريباً",
      "optional": "اختياري"
    },
    "saveButton": "حفظ",
    "cancel": "إلغاء"
  },
  "delete": {
    "title": "حذف {name}؟",
    "description": "سيؤدي هذا إلى إزالة {name} من قائمة الأدوية. لا يمكن التراجع عن هذا الإجراء.",
    "confirm": "حذف",
    "cancel": "إلغاء"
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/messages/en.json src/messages/ar.json
git commit -m "feat(medications): add en/ar translation keys"
```

---

## Task 6: MedicationsTable Component

**Files:**
- Create: `src/features/medications/components/MedicationsTable.tsx`

- [ ] **Step 1: Create table component**

```tsx
// src/features/medications/components/MedicationsTable.tsx
"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Medication } from "../types/medications.types";

interface Props {
  medications: Medication[];
  isLoading: boolean;
  onEdit: (medication: Medication) => void;
  onDelete: (medication: Medication) => void;
}

export function MedicationsTable({ medications, isLoading, onEdit, onDelete }: Props) {
  const t = useTranslations("medications");

  if (isLoading) {
    return <TableSkeleton />;
  }

  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="bg-gray-50">
          <th className="px-5 py-2.5 text-start text-xs font-semibold uppercase tracking-wide text-gray-500">
            {t("table.columns.name")}
          </th>
          <th className="px-4 py-2.5 text-start text-xs font-semibold uppercase tracking-wide text-gray-500">
            {t("table.columns.form")}
          </th>
          <th className="px-4 py-2.5 text-start text-xs font-semibold uppercase tracking-wide text-gray-500">
            {t("table.columns.strength")}
          </th>
          <th className="px-4 py-2.5 text-start text-xs font-semibold uppercase tracking-wide text-gray-500">
            {t("table.columns.category")}
          </th>
          <th className="hidden px-4 py-2.5 text-start text-xs font-semibold uppercase tracking-wide text-gray-500 lg:table-cell">
            {t("table.columns.defaultDose")}
          </th>
          <th className="px-4 py-2.5 text-start text-xs font-semibold uppercase tracking-wide text-gray-500">
            {t("table.columns.usage")}
          </th>
          <th className="hidden px-4 py-2.5 text-start text-xs font-semibold uppercase tracking-wide text-gray-500 xl:table-cell">
            {t("table.columns.notes")}
          </th>
          <th className="w-20 px-4 py-2.5" />
        </tr>
      </thead>
      <tbody>
        {medications.length === 0 ? (
          <tr>
            <td colSpan={8} className="py-16 text-center text-sm text-gray-400">
              {t("table.empty")}
            </td>
          </tr>
        ) : (
          medications.map((med) => (
            <tr key={med.id} className="group border-t border-gray-100 hover:bg-gray-50">
              <td className="px-5 py-3">
                <div className="text-sm font-semibold text-brand-black">{med.name}</div>
                {med.generic_name && (
                  <div className="text-xs text-gray-400">{med.generic_name}</div>
                )}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">{med.form ?? "—"}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{med.strength ?? "—"}</td>
              <td className="px-4 py-3 text-sm text-gray-400">—</td>
              <td className="hidden px-4 py-3 text-sm text-gray-400 lg:table-cell">—</td>
              <td className="px-4 py-3 text-sm text-gray-600">{med.total_prescriptions}</td>
              <td className="hidden px-4 py-3 text-sm text-gray-400 xl:table-cell">—</td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => onEdit(med)}
                    className="inline-flex size-7 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-400 transition-colors hover:border-brand-primary/30 hover:text-brand-primary"
                    aria-label={t("actions.edit")}
                  >
                    <Pencil className="size-3.5" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(med)}
                    className="inline-flex size-7 items-center justify-center rounded-md border border-red-100 bg-white text-gray-400 transition-colors hover:border-red-300 hover:text-red-500"
                    aria-label={t("actions.delete")}
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                  </button>
                </div>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

function TableSkeleton() {
  return (
    <table className="w-full border-collapse">
      <tbody>
        {Array.from({ length: 8 }).map((_, i) => (
          // eslint-disable-next-line react/no-array-index-key
          <tr key={i} className="border-t border-gray-100">
            <td className="px-5 py-3">
              <div className="h-4 w-32 animate-pulse rounded bg-gray-100" />
              <div className="mt-1 h-3 w-24 animate-pulse rounded bg-gray-100" />
            </td>
            <td className="px-4 py-3">
              <div className="h-4 w-16 animate-pulse rounded bg-gray-100" />
            </td>
            <td className="px-4 py-3">
              <div className="h-4 w-16 animate-pulse rounded bg-gray-100" />
            </td>
            <td className="px-4 py-3">
              <div className="h-4 w-20 animate-pulse rounded bg-gray-100" />
            </td>
            <td className="hidden px-4 py-3 lg:table-cell">
              <div className="h-4 w-20 animate-pulse rounded bg-gray-100" />
            </td>
            <td className="px-4 py-3">
              <div className="h-4 w-8 animate-pulse rounded bg-gray-100" />
            </td>
            <td className="hidden px-4 py-3 xl:table-cell">
              <div className="h-4 w-32 animate-pulse rounded bg-gray-100" />
            </td>
            <td className="px-4 py-3">
              <div className="h-7 w-16 animate-pulse rounded bg-gray-100" />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/medications/components/MedicationsTable.tsx
git commit -m "feat(medications): add MedicationsTable with hover actions and skeleton"
```

---

## Task 7: MedicationDrawer Component

**Files:**
- Create: `src/features/medications/components/MedicationDrawer.tsx`

- [ ] **Step 1: Create drawer component**

```tsx
// src/features/medications/components/MedicationDrawer.tsx
"use client";

import { useEffect } from "react";
import { Dialog } from "radix-ui";
import { X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { cn } from "@/common/utils/utils";
import { medicationFormSchema, type MedicationFormValues } from "../lib/medications.schemas";
import type { Medication } from "../types/medications.types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medication: Medication | null;
  onSubmit: (values: MedicationFormValues) => Promise<void>;
  isPending: boolean;
}

export function MedicationDrawer({ open, onOpenChange, medication, onSubmit, isPending }: Props) {
  const t = useTranslations("medications.drawer");
  const isEdit = medication !== null;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MedicationFormValues>({
    resolver: zodResolver(medicationFormSchema),
    defaultValues: { code: "", name: "", form: "", strength: "" },
  });

  useEffect(() => {
    if (!open) return;
    reset(
      isEdit
        ? {
            code: medication.code,
            name: medication.name,
            form: medication.form ?? "",
            strength: medication.strength ?? "",
          }
        : { code: "", name: "", form: "", strength: "" },
    );
  }, [open, isEdit, medication, reset]);

  const handleFormSubmit = handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/25 transition-opacity" />
        <Dialog.Content className="fixed inset-y-0 inset-e-0 z-41 flex w-full max-w-[480px] flex-col bg-white shadow-2xl outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right duration-300">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-gray-100 px-6 py-4">
            <div>
              <p className="text-xs text-gray-400">{t("breadcrumb")}</p>
              <Dialog.Title className="mt-0.5 text-base font-bold text-brand-black">
                {isEdit ? t("editTitle") : t("addTitle")}
              </Dialog.Title>
            </div>
            <Dialog.Close className="mt-0.5 rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600">
              <X className="size-4" aria-hidden />
            </Dialog.Close>
          </div>

          {/* Form */}
          <form onSubmit={handleFormSubmit} className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">

              {/* Medicine / Code */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  {t("fields.medicine")} <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("code")}
                  disabled={isEdit}
                  placeholder={t("fields.medicinePlaceholder")}
                  className={cn(
                    "w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors",
                    "focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10",
                    "disabled:cursor-not-allowed disabled:bg-gray-50 disabled:opacity-60",
                    errors.code ? "border-red-300" : "border-gray-200",
                  )}
                />
                {errors.code && (
                  <p className="mt-1 text-xs text-red-500">{errors.code.message}</p>
                )}
              </div>

              {/* Name */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  {t("fields.name")} <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("name")}
                  placeholder={t("fields.namePlaceholder")}
                  className={cn(
                    "w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors",
                    "focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10",
                    errors.name ? "border-red-300" : "border-gray-200",
                  )}
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
                )}
              </div>

              {/* Category — placeholder */}
              <PlaceholderField label={t("fields.category")} hint={t("fields.comingSoon")} />

              {/* Form + Strength */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                    {t("fields.form")}{" "}
                    <span className="text-xs font-normal text-gray-400">
                      ({t("fields.optional")})
                    </span>
                  </label>
                  <input
                    {...register("form")}
                    placeholder={t("fields.formPlaceholder")}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                    {t("fields.strength")}{" "}
                    <span className="text-xs font-normal text-gray-400">
                      ({t("fields.optional")})
                    </span>
                  </label>
                  <input
                    {...register("strength")}
                    placeholder={t("fields.strengthPlaceholder")}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
                  />
                </div>
              </div>

              {/* Default Dose — placeholder */}
              <PlaceholderField label={t("fields.defaultDose")} hint={t("fields.comingSoon")} />

              {/* Medical Rep — placeholder */}
              <PlaceholderField label={t("fields.medicalRep")} hint={t("fields.comingSoon")} />

              {/* Assigned To — placeholder */}
              <PlaceholderField label={t("fields.assignedTo")} hint={t("fields.comingSoon")} />

              {/* Company — placeholder */}
              <PlaceholderField label={t("fields.company")} hint={t("fields.comingSoon")} />

              {/* Notes — placeholder (textarea) */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700 opacity-60">
                  {t("fields.notes")}{" "}
                  <span className="text-xs font-normal text-gray-400">({t("fields.comingSoon")})</span>
                </label>
                <textarea
                  disabled
                  rows={3}
                  title={t("fields.comingSoon")}
                  className="w-full cursor-not-allowed resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm opacity-60 outline-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-6 py-4">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  {t("cancel")}
                </button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={isPending}
                className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? "…" : t("saveButton")}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function PlaceholderField({ label, hint }: { label: string; hint: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-gray-700 opacity-60">
        {label}{" "}
        <span className="text-xs font-normal text-gray-400">({hint})</span>
      </label>
      <input
        disabled
        title={hint}
        className="w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm opacity-60 outline-none"
      />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/medications/components/MedicationDrawer.tsx
git commit -m "feat(medications): add MedicationDrawer with add/edit modes"
```

---

## Task 8: DeleteMedicationDialog Component

**Files:**
- Create: `src/features/medications/components/DeleteMedicationDialog.tsx`

- [ ] **Step 1: Create delete dialog**

```tsx
// src/features/medications/components/DeleteMedicationDialog.tsx
"use client";

import { AlertDialog } from "radix-ui";
import { useTranslations } from "next-intl";
import type { Medication } from "../types/medications.types";

interface Props {
  medication: Medication | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
}

export function DeleteMedicationDialog({ medication, onOpenChange, onConfirm, isPending }: Props) {
  const t = useTranslations("medications.delete");

  return (
    <AlertDialog.Root open={!!medication} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/30" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-[51] w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl outline-none">
          <AlertDialog.Title className="text-base font-bold text-brand-black">
            {t("title", { name: medication?.name ?? "" })}
          </AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-sm leading-relaxed text-gray-500">
            {t("description", { name: medication?.name ?? "" })}
          </AlertDialog.Description>
          <div className="mt-6 flex justify-end gap-2">
            <AlertDialog.Cancel asChild>
              <button
                type="button"
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                {t("cancel")}
              </button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <button
                type="button"
                disabled={isPending}
                onClick={(e) => {
                  e.preventDefault();
                  onConfirm();
                }}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? "…" : t("confirm")}
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/medications/components/DeleteMedicationDialog.tsx
git commit -m "feat(medications): add DeleteMedicationDialog"
```

---

## Task 9: MedicationsPage Container

**Files:**
- Create: `src/features/medications/components/MedicationsPage.tsx`

- [ ] **Step 1: Create page container**

```tsx
// src/features/medications/components/MedicationsPage.tsx
"use client";

import { useState, useDeferredValue } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { MedicationsTable } from "./MedicationsTable";
import { MedicationDrawer } from "./MedicationDrawer";
import { DeleteMedicationDialog } from "./DeleteMedicationDialog";
import { useMedications } from "../hooks/useMedications";
import {
  useCreateMedication,
  useUpdateMedication,
  useDeleteMedication,
} from "../hooks/useManageMedications";
import type { Medication } from "../types/medications.types";
import type { MedicationFormValues } from "../lib/medications.schemas";

const PAGE_LIMIT = 10;

export function MedicationsPage() {
  const t = useTranslations("medications");

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const [deletingMedication, setDeletingMedication] = useState<Medication | null>(null);

  const deferredSearch = useDeferredValue(search);

  const { data, isLoading } = useMedications({
    page,
    limit: PAGE_LIMIT,
    search: deferredSearch,
  });

  const createMutation = useCreateMedication();
  const updateMutation = useUpdateMedication();
  const deleteMutation = useDeleteMedication();

  function openAddDrawer() {
    setEditingMedication(null);
    setDrawerOpen(true);
  }

  function openEditDrawer(medication: Medication) {
    setEditingMedication(medication);
    setDrawerOpen(true);
  }

  async function handleDrawerSubmit(values: MedicationFormValues) {
    const emptyToUndefined = (v: string) => v.trim() || undefined;
    if (editingMedication) {
      await updateMutation.mutateAsync({
        id: editingMedication.id,
        data: {
          name: values.name,
          form: emptyToUndefined(values.form),
          strength: emptyToUndefined(values.strength),
        },
      });
    } else {
      await createMutation.mutateAsync({
        code: values.code,
        name: values.name,
        form: emptyToUndefined(values.form),
        strength: emptyToUndefined(values.strength),
      });
    }
    setDrawerOpen(false);
  }

  async function handleDeleteConfirm() {
    if (!deletingMedication) return;
    await deleteMutation.mutateAsync(deletingMedication.id);
    setDeletingMedication(null);
  }

  const total = data?.meta.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_LIMIT);
  const from = total === 0 ? 0 : (page - 1) * PAGE_LIMIT + 1;
  const to = Math.min(page * PAGE_LIMIT, total);

  return (
    <div className="flex min-h-full flex-col">
      {/* Page header */}
      <div className="flex items-center justify-between px-6 py-5">
        <div>
          <h1 className="text-2xl font-bold text-brand-black">{t("title")}</h1>
          <p className="mt-1 text-sm text-gray-400">{t("subtitle")}</p>
        </div>
        <button
          type="button"
          onClick={openAddDrawer}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-primary/90"
        >
          + {t("addButton")}
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-6 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled
            title={t("filters.comingSoon")}
            className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-400 opacity-60"
          >
            {t("filters.category")} ↓
          </button>
          <button
            type="button"
            disabled
            title={t("filters.comingSoon")}
            className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-400 opacity-60"
          >
            {t("filters.form")} ↓
          </button>
        </div>
        <div className="relative">
          <Search
            className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-gray-400"
            aria-hidden
          />
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={t("searchPlaceholder")}
            className="w-64 rounded-lg border border-gray-200 py-2 pe-4 ps-9 text-sm outline-none transition-colors focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
          />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-x-auto">
        <MedicationsTable
          medications={data?.data ?? []}
          isLoading={isLoading}
          onEdit={openEditDrawer}
          onDelete={setDeletingMedication}
        />
      </div>

      {/* Pagination */}
      {!isLoading && total > 0 && (
        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-3">
          <span className="text-sm text-gray-400">
            {t("table.showing", { from, to, total })}
          </span>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 10) }).map((_, i) => {
              const p = i + 1;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={`inline-flex size-8 items-center justify-center rounded-lg text-sm transition-colors ${
                    page === p
                      ? "bg-brand-primary text-white"
                      : "border border-gray-200 text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {p}
                </button>
              );
            })}
            {totalPages > 10 && (
              <span className="px-1 text-sm text-gray-400">…</span>
            )}
          </div>
        </div>
      )}

      {/* Drawer */}
      <MedicationDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        medication={editingMedication}
        onSubmit={handleDrawerSubmit}
        isPending={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete dialog */}
      <DeleteMedicationDialog
        medication={deletingMedication}
        onOpenChange={(open) => {
          if (!open) setDeletingMedication(null);
        }}
        onConfirm={() => void handleDeleteConfirm()}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/medications/components/MedicationsPage.tsx
git commit -m "feat(medications): add MedicationsPage container"
```

---

## Task 10: Next.js Route Page

**Files:**
- Create: `src/app/[locale]/[orgId]/[branchId]/dashboard/medicine/page.tsx`

> **Note:** The route is `/medicine` (not `/medications`) because the sidebar nav (`src/components/common/Sidebar.tsx`) and access guard (`src/components/layout/dashboard-access.ts`) are already wired to `/dashboard/medicine`.

- [ ] **Step 1: Create route page**

```tsx
// src/app/[locale]/[orgId]/[branchId]/dashboard/medicine/page.tsx
import { setRequestLocale } from "next-intl/server";
import { MedicationsPage } from "@/features/medications/components/MedicationsPage";

type Props = {
  params: Promise<{ locale: string; orgId: string; branchId: string }>;
};

export default async function MedicineRoute({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <MedicationsPage />;
}
```

- [ ] **Step 2: Commit**

```bash
git add "src/app/[locale]/[orgId]/[branchId]/dashboard/medicine/page.tsx"
git commit -m "feat(medications): add /dashboard/medicine route page"
```

---

## Task 11: Verify

- [ ] **Step 1: Run TypeScript check**

```bash
npx tsc --noEmit --pretty false
```

Expected: No errors. Fix any type errors before continuing.

- [ ] **Step 2: Run lint**

```bash
npm run lint
```

Expected: No errors.

- [ ] **Step 3: Run schema tests**

```bash
npx vitest run src/features/medications/lib/medications.schemas.test.ts
```

Expected: 7 tests PASS.

- [ ] **Step 4: Run dev server and test manually**

```bash
npm run dev
```

Navigate to `http://localhost:3000/en/{orgId}/{branchId}/dashboard/medicine`. Verify:

1. Page loads with "Medicines" heading and "+ New Medicine" button
2. Table shows loading skeleton, then populates with API data
3. Search input filters results after typing
4. Row hover reveals ✏ and 🗑 buttons
5. Clicking ✏ opens drawer pre-filled with the medication's data; saving calls `PATCH` and table refreshes
6. Clicking "+ New Medicine" opens blank drawer; filling Code + Name and saving calls `POST` and new row appears
7. Clicking 🗑 opens confirmation dialog; clicking Delete removes the row
8. Placeholder fields (Category, Default Dose, etc.) are visible but disabled with `opacity-60`
9. Sidebar "Medicines" nav item is highlighted when on this page
10. Arabic locale (`/ar/…`) renders RTL correctly

- [ ] **Step 5: Run build**

```bash
npm run build
```

Expected: Builds with no errors.

- [ ] **Step 6: Final commit**

```bash
git add .
git commit -m "feat(medications): complete medicines dashboard — table, drawer, delete dialog"
```
