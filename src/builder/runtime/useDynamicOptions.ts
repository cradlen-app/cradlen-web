"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { apiAuthFetch } from "@/infrastructure/http/api";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import type { FieldOption, FormFieldDto } from "../templates/template.types";
import { interpolateUrl } from "./url-interpolation";
import { useTemplateExecution } from "./TemplateExecutionContext";

/**
 * Minimal staff-list shape consumed by the doctor-picker mapper. Mirrors a
 * subset of the backend StaffResponseDto. Kept local so the builder layer
 * doesn't depend on `@/core/staff` internals.
 */
type StaffRow = {
  profile_id: string;
  first_name: string;
  last_name: string;
  email: string;
};

type StaffListResponse = { data: StaffRow[] };

type MedicationRow = {
  id: string;
  name: string;
  generic_name?: string | null;
  strength?: string | null;
};

type MedicationListResponse = { data: MedicationRow[] };

export interface DynamicOption extends FieldOption {
  /** Raw payload row, so downstream hooks (e.g. specialty auto-fill) avoid a second fetch. */
  raw: unknown;
}

export interface DynamicOptionsResult {
  options: DynamicOption[];
  isLoading: boolean;
  isError: boolean;
  /** True only when this field uses `optionsSource`. */
  enabled: boolean;
}

interface Mapper {
  /** Append default paging params suitable for the endpoint. */
  finalizeUrl: (url: string) => string;
  /** Map the response to options. */
  mapResponse: (payload: unknown) => DynamicOption[];
}

/**
 * Pick a response mapper based on the resolved URL. Today only the staff list
 * endpoint is consumed; new endpoints register an entry here.
 */
function pickMapper(url: string): Mapper {
  if (/\/organizations\/[^/]+\/staff(\?|$)/.test(url)) {
    return {
      finalizeUrl: (u) =>
        u.includes("page=") || u.includes("limit=")
          ? u
          : `${u}${u.includes("?") ? "&" : "?"}page=1&limit=100`,
      mapResponse: (payload) => {
        const list = (payload as StaffListResponse | undefined)?.data ?? [];
        return list.map((member) => {
          const name = `${member.first_name ?? ""} ${member.last_name ?? ""}`.trim();
          return {
            code: member.profile_id,
            label: name.length > 0 ? name : member.email,
            raw: member,
          };
        });
      },
    };
  }

  if (/\/organizations\/[^/]+\/specialties(\?|$)/.test(url)) {
    return {
      finalizeUrl: (u) => u,
      mapResponse: (payload) => {
        const list =
          (payload as { data?: Array<{ id: string; code: string; name: string }> })?.data ?? [];
        return list.map((s) => ({ code: s.code, label: s.name, raw: s }));
      },
    };
  }

  if (/\/care-paths(\?|$)/.test(url)) {
    return {
      finalizeUrl: (u) => u,
      mapResponse: (payload) => {
        const list =
          (payload as { data?: Array<{ id: string; code: string; name: string }> })?.data ?? [];
        return list.map((c) => ({ code: c.code, label: c.name, raw: c }));
      },
    };
  }

  if (/\/medications(\?|$)/.test(url)) {
    return {
      finalizeUrl: (u) =>
        u.includes("page=") || u.includes("limit=")
          ? u
          : `${u}${u.includes("?") ? "&" : "?"}page=1&limit=100`,
      mapResponse: (payload) => {
        const list = (payload as MedicationListResponse | undefined)?.data ?? [];
        return list.map((med) => {
          const suffix = med.strength ? ` (${med.strength})` : "";
          return {
            code: med.id,
            label: `${med.name}${suffix}`,
            raw: med,
          };
        });
      },
    };
  }

  // Generic fallback: assume `{ data: FieldOption[] }` or `FieldOption[]`.
  return {
    finalizeUrl: (u) => u,
    mapResponse: (payload) => {
      const list = Array.isArray(payload)
        ? (payload as FieldOption[])
        : ((payload as { data?: FieldOption[] })?.data ?? []);
      return list.map((opt) => ({ ...opt, raw: opt }));
    },
  };
}

export function useDynamicOptions(field: FormFieldDto): DynamicOptionsResult {
  const optionsSource = field.config?.ui?.optionsSource;
  const organizationId = useAuthContextStore((s) => s.organizationId);
  const branchId = useAuthContextStore((s) => s.branchId);
  const { state } = useTemplateExecution();

  // Form-derived placeholders (e.g. `{medical_rep_id}`) — extract the keys
  // referenced in the template so we only depend on the values that matter.
  const formVarKeys = useMemo(() => {
    if (!optionsSource) return [] as string[];
    const matches = optionsSource.matchAll(/\{(\w+)\}/g);
    const keys: string[] = [];
    for (const m of matches) {
      const k = m[1];
      if (k !== "org_id" && k !== "branch_id" && !keys.includes(k)) keys.push(k);
    }
    return keys;
  }, [optionsSource]);

  // Stable signature of the form-derived placeholder values; changing only
  // these keys triggers a re-resolution (not unrelated form edits). Placeholder
  // values may live in `systemValues` (SYSTEM-bound discriminators like
  // `specialty_code`) or `formValues` — read systemValues first.
  const formVarsSignature = formVarKeys
    .map((k) => {
      const v = state.systemValues[k] ?? state.formValues[k];
      return `${k}=${typeof v === "string" ? v : v == null ? "" : String(v)}`;
    })
    .join("&");

  const formVars = useMemo(() => {
    const out: Record<string, string | null | undefined> = {};
    for (const k of formVarKeys) {
      const v = state.systemValues[k] ?? state.formValues[k];
      out[k] = typeof v === "string" ? v : v == null ? null : String(v);
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formVarsSignature]);

  const resolvedUrl = useMemo(() => {
    if (!optionsSource) return null;
    return interpolateUrl(optionsSource, {
      org_id: organizationId,
      branch_id: branchId,
      ...formVars,
    });
  }, [optionsSource, organizationId, branchId, formVars]);

  const mapper = useMemo(
    () => (resolvedUrl ? pickMapper(resolvedUrl) : null),
    [resolvedUrl],
  );

  const finalUrl = useMemo(
    () => (resolvedUrl && mapper ? mapper.finalizeUrl(resolvedUrl) : null),
    [resolvedUrl, mapper],
  );

  const query = useQuery({
    queryKey: ["form-template-options", finalUrl],
    queryFn: () => apiAuthFetch<unknown>(finalUrl as string),
    enabled: Boolean(finalUrl),
    staleTime: 60_000,
  });

  const options = useMemo(() => {
    if (!query.data || !mapper) return [];
    return mapper.mapResponse(query.data);
  }, [query.data, mapper]);

  return {
    options,
    isLoading: Boolean(optionsSource) && query.isLoading,
    isError: Boolean(optionsSource) && query.isError,
    enabled: Boolean(optionsSource),
  };
}
