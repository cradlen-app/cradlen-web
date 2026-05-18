export interface MedicalRepListParams {
  page: number;
  limit: number;
  search: string;
  status: string;
}

export const medicalRepQueryKeys = {
  all: () => ["medical-reps"] as const,
  list: (params: MedicalRepListParams) =>
    ["medical-reps", "list", params.page, params.limit, params.search, params.status] as const,
} as const;
