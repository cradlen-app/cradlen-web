export const VISIT_TYPE = {
  VISIT: "VISIT",
  FOLLOW_UP: "FOLLOW_UP",
  MEDICAL_REP: "MEDICAL_REP",
} as const;

export const VISIT_PRIORITY = {
  NORMAL: "NORMAL",
  EMERGENCY: "EMERGENCY",
} as const;

export const CHIEF_COMPLAINT_CATEGORIES = [
  "PREGNANCY",
  "BLEEDING",
  "PAIN",
  "INFECTION",
  "CONTRACEPTION",
  "INFERTILITY",
  "MENSTRUAL",
  "POSTPARTUM",
  "ROUTINE_CHECK",
  "OTHER",
] as const;

export type ChiefComplaintCategory = (typeof CHIEF_COMPLAINT_CATEGORIES)[number];

export const VITAL_SEVERITY = ["mild", "moderate", "severe"] as const;
export type VitalSeverity = (typeof VITAL_SEVERITY)[number];

export const CHIEF_COMPLAINT_MAX = 5000;
export const CC_META_FIELD_MAX = 256;
export const CC_META_CATEGORIES_MAX = 20;
