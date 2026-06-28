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
} as const;

export type StaffApiRole = (typeof STAFF_API_ROLE)[keyof typeof STAFF_API_ROLE];

/** Roles a non-OWNER may not assign. */
export const PRIVILEGED_API_ROLES: readonly StaffApiRole[] = [
  STAFF_API_ROLE.OWNER,
  STAFF_API_ROLE.BRANCH_MANAGER,
];

/**
 * JobFunction codes — the coarse operational role a staff member performs.
 * Exactly three: DOCTOR (clinical), RECEPTIONIST, ACCOUNTANT. The clinical
 * detail (OB/GYN, etc.) lives in Specialty, which drives examination templates.
 */
export const JOB_FUNCTION_CODE = {
  DOCTOR: "DOCTOR",
  RECEPTIONIST: "RECEPTIONIST",
  ACCOUNTANT: "ACCOUNTANT",
} as const;

export type JobFunctionCode = (typeof JOB_FUNCTION_CODE)[keyof typeof JOB_FUNCTION_CODE];

/** Job functions that count as clinical (drive the is_clinical flag). */
export const CLINICAL_JOB_FUNCTIONS: readonly JobFunctionCode[] = [
  JOB_FUNCTION_CODE.DOCTOR,
];

/** Job functions that count as physicians (visit doctor-picker). */
export const DOCTOR_JOB_FUNCTIONS: readonly JobFunctionCode[] = [
  JOB_FUNCTION_CODE.DOCTOR,
];

export const EXECUTIVE_TITLE = {
  CEO: "CEO",
  COO: "COO",
  CFO: "CFO",
  CMO: "CMO",
} as const;

export type ExecutiveTitleCode = (typeof EXECUTIVE_TITLE)[keyof typeof EXECUTIVE_TITLE];

/**
 * Coarse job-function picker for a person (an owner at signup, or a staff member
 * when invited / added / edited): DOCTOR maps 1:1 to the DOCTOR job function
 * (with a separately chosen Specialty driving templates); RECEPTIONIST /
 * ACCOUNTANT map to their codes; NONE = purely administrative (no job function).
 */
export const JOB_ROLE = {
  DOCTOR: "DOCTOR",
  RECEPTIONIST: "RECEPTIONIST",
  ACCOUNTANT: "ACCOUNTANT",
  NONE: "NONE",
} as const;

export type JobRoleCode = (typeof JOB_ROLE)[keyof typeof JOB_ROLE];

export const ENGAGEMENT_TYPE = {
  FULL_TIME: "FULL_TIME",
  PART_TIME: "PART_TIME",
  ON_DEMAND: "ON_DEMAND",
  EXTERNAL_CONSULTANT: "EXTERNAL_CONSULTANT",
} as const;

export type EngagementTypeCode = (typeof ENGAGEMENT_TYPE)[keyof typeof ENGAGEMENT_TYPE];

export const DEFAULT_ENGAGEMENT_TYPE: EngagementTypeCode = ENGAGEMENT_TYPE.FULL_TIME;

// Auth cookie/token transport constants now live in `common/` so the
// infrastructure auth-transport layer and root `proxy.ts` can read them without
// importing up into this feature. Re-exported here for the auth feature's own
// consumers (route handlers, server helpers, etc.).
export {
  AUTH_TOKEN_COOKIE,
  AUTH_REFRESH_TOKEN_COOKIE,
  AUTH_SELECTION_TOKEN_COOKIE,
  SIGNUP_TOKEN_COOKIE,
  RESET_TOKEN_COOKIE,
  AUTH_REFRESH_TOKEN_MAX_AGE,
  DEFAULT_AUTH_EXPIRES_IN,
  ACCESS_TOKEN_TTL_SECONDS,
  SILENT_REFRESH_RATIO,
  AUTH_SELECTION_TOKEN_MAX_AGE,
  SIGNUP_TOKEN_MAX_AGE,
  RESET_TOKEN_MAX_AGE,
} from "@/common/constants/auth-cookies";
