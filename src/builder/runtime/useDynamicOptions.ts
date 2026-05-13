"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { apiAuthFetch } from "@/infrastructure/http/api";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import type { FieldOption, FormFieldDto } from "../templates/template.types";
import { interpolateUrl } from "./url-interpolation";

/**
 * Minimal staff-list shape consumed by the doctor-picker mapper. Mirrors a
 * subset of the backend StaffResponseDto. Kept local so the builder layer
 * doesn't depend on `@/core/staff` internals.
 */
type StaffRow = {
  staff_id: string;
  first_name: string;
  last_name: string;
  email: string;
};

type StaffListResponse = { data: StaffRow[] };

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
            code: member.staff_id,
            label: name.length > 0 ? name : member.email,
            raw: member,
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

  const resolvedUrl = useMemo(() => {
    if (!optionsSource) return null;
    return interpolateUrl(optionsSource, {
      org_id: organizationId,
      branch_id: branchId,
    });
  }, [optionsSource, organizationId, branchId]);

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
