import { apiAuthFetch } from "@/infrastructure/http/api";

export interface FieldFlagDto {
  id: string;
  patient_id: string;
  organization_id: string;
  author_id: string;
  section_code: string;
  field_code: string;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpsertFieldFlagArgs {
  patientId: string;
  section_code: string;
  field_code: string;
  note?: string;
}

export interface UpdateFieldFlagNoteArgs {
  patientId: string;
  flagId: string;
  note?: string;
}

export function listFieldFlags(
  patientId: string,
): Promise<{ data: FieldFlagDto[] }> {
  return apiAuthFetch<{ data: FieldFlagDto[] }>(
    `/v1/patients/${patientId}/field-flags`,
  );
}

export function upsertFieldFlag({
  patientId,
  ...body
}: UpsertFieldFlagArgs): Promise<{ data: FieldFlagDto }> {
  return apiAuthFetch<{ data: FieldFlagDto }>(
    `/v1/patients/${patientId}/field-flags`,
    { method: "POST", body: JSON.stringify(body) },
  );
}

export function updateFieldFlagNote({
  patientId,
  flagId,
  note,
}: UpdateFieldFlagNoteArgs): Promise<{ data: FieldFlagDto }> {
  return apiAuthFetch<{ data: FieldFlagDto }>(
    `/v1/patients/${patientId}/field-flags/${flagId}`,
    { method: "PATCH", body: JSON.stringify({ note }) },
  );
}

export function removeFieldFlag(
  patientId: string,
  flagId: string,
): Promise<void> {
  return apiAuthFetch<void>(
    `/v1/patients/${patientId}/field-flags/${flagId}`,
    { method: "DELETE" },
  );
}
