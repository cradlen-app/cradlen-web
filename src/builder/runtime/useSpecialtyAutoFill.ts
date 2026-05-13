"use client";

import { useEffect, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { useTemplateExecution } from "./TemplateExecutionContext";
import { interpolateUrl } from "./url-interpolation";
import type { FormFieldDto } from "../templates/template.types";

const SPECIALTY_CODE_FIELD = "specialty_code";

type StaffRow = {
  staff_id: string;
  specialties?: Array<{ code: string }>;
};

type StaffListResponse = { data: StaffRow[] };

type DoctorFieldEntry = {
  field: FormFieldDto;
  queryUrl: string;
};

/**
 * Watches every SELECT field bound to the doctor entity (or whose
 * `config.logic.entity === "doctor"`). When the user picks a doctor, reads
 * that staff member's first specialty from the cached options and writes its
 * `code` into `systemValues.specialty_code` — the discriminator the rules
 * engine uses to gate clinical sections.
 *
 * Relies on the cache populated by `useDynamicOptions`, so no extra fetch.
 */
export function useSpecialtyAutoFill(): void {
  const { template, state, setFieldValue, systemFieldCodes } = useTemplateExecution();
  const queryClient = useQueryClient();
  const organizationId = useAuthContextStore((s) => s.organizationId);
  const branchId = useAuthContextStore((s) => s.branchId);

  const doctorFields = useMemo<DoctorFieldEntry[]>(() => {
    const entries: DoctorFieldEntry[] = [];
    for (const section of template.sections) {
      for (const field of section.fields) {
        if (field.type !== "SELECT") continue;
        const isDoctor =
          field.config?.logic?.entity === "doctor" ||
          field.code.startsWith("assigned_doctor_");
        if (!isDoctor) continue;
        const source = field.config?.ui?.optionsSource;
        if (!source) continue;
        const url = interpolateUrl(source, {
          org_id: organizationId,
          branch_id: branchId,
        });
        if (!url) continue;
        const finalUrl =
          url.includes("page=") || url.includes("limit=")
            ? url
            : `${url}${url.includes("?") ? "&" : "?"}page=1&limit=100`;
        entries.push({ field, queryUrl: finalUrl });
      }
    }
    return entries;
  }, [template, organizationId, branchId]);

  const prevValues = useRef<Record<string, unknown>>({});

  useEffect(() => {
    if (doctorFields.length === 0) return;
    if (!systemFieldCodes.has(SPECIALTY_CODE_FIELD)) return;

    let resolvedFromField: string | null = null;
    for (const { field, queryUrl } of doctorFields) {
      const current = state.formValues[field.code];
      const previous = prevValues.current[field.code];
      prevValues.current[field.code] = current;
      if (current === previous) continue;
      if (typeof current !== "string" || current.length === 0) continue;

      const cached = queryClient.getQueryData<StaffListResponse>([
        "form-template-options",
        queryUrl,
      ]);
      const list = cached?.data ?? [];
      const staff = list.find((m) => m.staff_id === current);
      const code = staff?.specialties?.[0]?.code ?? null;
      if (code) {
        resolvedFromField = code;
        break;
      }
    }

    if (resolvedFromField && state.systemValues[SPECIALTY_CODE_FIELD] !== resolvedFromField) {
      setFieldValue(SPECIALTY_CODE_FIELD, resolvedFromField);
    }
  }, [doctorFields, state.formValues, state.systemValues, setFieldValue, systemFieldCodes, queryClient]);
}
