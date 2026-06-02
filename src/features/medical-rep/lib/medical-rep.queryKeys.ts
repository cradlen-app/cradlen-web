export interface MedicalRepListParams {
  page: number;
  limit: number;
  search: string;
}

export const medicalRepQueryKeys = {
  all: () => ["medical-reps"] as const,
  list: (params: MedicalRepListParams) =>
    ["medical-reps", "list", params.page, params.limit, params.search] as const,
  visitHistory: (visitId: string) =>
    ["medical-reps", "visit-history", visitId] as const,
} as const;
