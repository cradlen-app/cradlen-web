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
