export const STAFF_ROLE = {
  OWNER: "owner",
  DOCTOR: "doctor",
  RECEPTION: "reception",
  UNKNOWN: "unknown",
} as const;

export type StaffRole = (typeof STAFF_ROLE)[keyof typeof STAFF_ROLE];

/**
 * Backend role taxonomy used by the staff feature against the current
 * /v1/organizations/:orgId/{staff,invitations} endpoints. Authority tier —
 * separate from JOB_FUNCTION_CODE (which is what the person actually does).
 */
export const STAFF_API_ROLE = {
  OWNER: "OWNER",
  BRANCH_MANAGER: "BRANCH_MANAGER",
  STAFF: "STAFF",
  EXTERNAL: "EXTERNAL",
} as const;

export type StaffApiRole = (typeof STAFF_API_ROLE)[keyof typeof STAFF_API_ROLE];

/** Roles a non-OWNER may not assign. */
export const PRIVILEGED_API_ROLES: readonly StaffApiRole[] = [
  STAFF_API_ROLE.OWNER,
  STAFF_API_ROLE.BRANCH_MANAGER,
];

/**
 * JobFunction codes — what the staff member actually does day-to-day.
 * Drives is_clinical and gating for RECEPTIONIST view-staff permission.
 */
export const JOB_FUNCTION_CODE = {
  OBGYN: "OBGYN",
  ANESTHESIOLOGIST: "ANESTHESIOLOGIST",
  PEDIATRICIAN: "PEDIATRICIAN",
  OTHER_DOCTOR: "OTHER_DOCTOR",
  NURSE: "NURSE",
  ASSISTANT: "ASSISTANT",
  RECEPTIONIST: "RECEPTIONIST",
  ACCOUNTANT: "ACCOUNTANT",
} as const;

export type JobFunctionCode = (typeof JOB_FUNCTION_CODE)[keyof typeof JOB_FUNCTION_CODE];

export const CLINICAL_JOB_FUNCTIONS: readonly JobFunctionCode[] = [
  JOB_FUNCTION_CODE.OBGYN,
  JOB_FUNCTION_CODE.ANESTHESIOLOGIST,
  JOB_FUNCTION_CODE.PEDIATRICIAN,
  JOB_FUNCTION_CODE.OTHER_DOCTOR,
  JOB_FUNCTION_CODE.NURSE,
];

export const EXECUTIVE_TITLE = {
  CEO: "CEO",
  COO: "COO",
  CFO: "CFO",
  CMO: "CMO",
} as const;

export type ExecutiveTitleCode = (typeof EXECUTIVE_TITLE)[keyof typeof EXECUTIVE_TITLE];

export const ENGAGEMENT_TYPE = {
  FULL_TIME: "FULL_TIME",
  PART_TIME: "PART_TIME",
  ON_DEMAND: "ON_DEMAND",
  EXTERNAL_CONSULTANT: "EXTERNAL_CONSULTANT",
} as const;

export type EngagementTypeCode = (typeof ENGAGEMENT_TYPE)[keyof typeof ENGAGEMENT_TYPE];

export const DEFAULT_ENGAGEMENT_TYPE: EngagementTypeCode = ENGAGEMENT_TYPE.FULL_TIME;

export const AUTH_TOKEN_COOKIE = "cradlen-auth-token";
export const AUTH_REFRESH_TOKEN_COOKIE = "cradlen-refresh-token";
export const AUTH_SELECTION_TOKEN_COOKIE = "cradlen-selection-token";
export const SIGNUP_TOKEN_COOKIE = "cradlen-signup-token";
export const RESET_TOKEN_COOKIE = "cradlen-reset-token";
export const AUTH_REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 30;
export const DEFAULT_AUTH_EXPIRES_IN = 60 * 60;
export const AUTH_SELECTION_TOKEN_MAX_AGE = 60 * 30;
export const SIGNUP_TOKEN_MAX_AGE = 60 * 10;
export const RESET_TOKEN_MAX_AGE = 60 * 30;
