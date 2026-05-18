export interface MedicationListParams {
  page: number;
  limit: number;
  search: string;
}

export const medicationQueryKeys = {
  all: () => ["medications"] as const,
  list: (params: MedicationListParams) =>
    ["medications", "list", params.page, params.limit, params.search] as const,
} as const;
