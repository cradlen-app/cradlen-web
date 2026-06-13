export type MedicationSort = "name" | "usage";

export interface MedicationListParams {
  page: number;
  limit: number;
  search: string;
  category?: string;
  form?: string;
  sort?: MedicationSort;
}

export const medicationQueryKeys = {
  all: () => ["medications"] as const,
  list: (params: MedicationListParams) =>
    [
      "medications",
      "list",
      params.page,
      params.limit,
      params.search,
      params.category ?? null,
      params.form ?? null,
      params.sort ?? "name",
    ] as const,
  facets: () => ["medications", "facets"] as const,
} as const;
