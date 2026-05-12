import type {
  EngagementTypeCode,
  ExecutiveTitleCode,
  StaffApiRole,
} from "@/features/auth/lib/auth.constants";
import type {
  ApiStaffBranch,
  ApiStaffBranchSchedule,
  ApiStaffJobFunction,
  ApiStaffSpecialty,
} from "./staff.api.types";

export type StaffStatus = "available" | "notAvailable";

/**
 * Frontend display model for a staff member. Maps 1:1 from the backend
 * StaffResponseDto with a few derived UI fields (handle, status, workSchedule).
 *
 * `role` here is the backend Role enum (OWNER/BRANCH_MANAGER/STAFF/EXTERNAL).
 * `jobFunctions` and `specialties` come from the orthogonal JobFunction/Specialty
 * tables.
 */
export type StaffMember = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  handle: string;
  phone: string;
  status: StaffStatus;
  /** Primary role (first of `roles`), normalized to the backend enum. */
  role: StaffApiRole | "UNKNOWN";
  /** Raw role objects (id + name) so OWNER edits can preserve role_ids. */
  roles: { id: string; role: StaffApiRole | "UNKNOWN"; name: string }[];
  branches: ApiStaffBranch[];
  jobFunctions: ApiStaffJobFunction[];
  specialties: ApiStaffSpecialty[];
  executiveTitle?: ExecutiveTitleCode | null;
  engagementType?: EngagementTypeCode | null;
  schedule?: ApiStaffBranchSchedule[];
  workSchedule?: string;
  /** Convenience: any of the staff's job_functions has is_clinical=true. */
  isClinical: boolean;
};

/** Filter selection for the staff list toolbar. */
export type StaffFilter = "all" | StaffApiRole;

/** Role-picker option (id from backend roles endpoint + the typed enum). */
export type StaffRoleOption = {
  id: string;
  name: string;
  role: StaffApiRole | "UNKNOWN";
};

/** @deprecated kept while consumers migrate; prefer StaffRoleOption. */
export type StaffRoleFilter = StaffRoleOption;

/** @deprecated legacy alias — use `StaffApiRole | "UNKNOWN"`. */
export type StaffRole = StaffApiRole | "UNKNOWN";
