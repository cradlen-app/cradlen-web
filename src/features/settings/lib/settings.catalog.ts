import type { EngagementType, ExecutiveTitle } from "@/types/user.types";

export const EXECUTIVE_TITLES: ExecutiveTitle[] = ["CEO", "COO", "CFO", "CMO"];

export const ENGAGEMENT_TYPES: EngagementType[] = [
  "FULL_TIME",
  "PART_TIME",
  "ON_DEMAND",
  "EXTERNAL_CONSULTANT",
];

/**
 * Job-function codes the FE offers. Backend validates these strictly: any
 * unknown code returns 400. Keep in sync with the backend `JobFunction` table.
 */
export const JOB_FUNCTION_CODES: { code: string; labelKey: string }[] = [
  { code: "OBGYN", labelKey: "OBGYN" },
  { code: "PEDIATRICIAN", labelKey: "PEDIATRICIAN" },
];

/**
 * Specialty codes the FE offers. Backend matches on code (exact) or name
 * (case-insensitive); we send codes for stability.
 */
export const SPECIALTY_CODES: { code: string; labelKey: string }[] = [
  { code: "OBGYN", labelKey: "OBGYN" },
  { code: "PEDIATRICS", labelKey: "PEDIATRICS" },
];
