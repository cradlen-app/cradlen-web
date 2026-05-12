import type { EngagementTypeCode, ExecutiveTitleCode } from "@/features/auth/lib/auth.constants";

export type ApiStaffRole = {
  id: string;
  name: string;
};

export type ApiStaffJobFunction = {
  id: string;
  code: string;
  name: string;
  is_clinical: boolean;
};

export type ApiStaffSpecialty = {
  id: string;
  code: string;
  name: string;
};

export type ApiStaffShift = {
  id?: string;
  start_time: string;
  end_time: string;
};

export type ApiStaffDay = {
  id?: string;
  day_of_week: "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";
  shifts: ApiStaffShift[];
};

export type ApiStaffSchedule = {
  id?: string;
  days: ApiStaffDay[];
};

export type ApiStaffBranchSchedule = {
  branch_id: string;
  days: Array<{
    day_of_week: ApiStaffDay["day_of_week"];
    shifts: Array<{ start_time: string; end_time: string }>;
  }>;
};

export type ApiStaffBranch = {
  id: string;
  name?: string;
  address?: string;
  city?: string;
  governorate?: string;
  country?: string;
  is_main?: boolean;
};

/**
 * Staff list item shape from GET /v1/organizations/:orgId/staff (StaffResponseDto).
 * Per backend StaffResponseDto: roles, branches, job_functions, specialties are full
 * objects; executive_title + engagement_type live at the row level.
 */
export type ApiStaffMember = {
  staff_id: string;
  /** @deprecated some legacy responses still use profile_id */
  profile_id?: string;
  user_id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string | null;
  executive_title?: ExecutiveTitleCode | null;
  engagement_type?: EngagementTypeCode | null;
  roles: ApiStaffRole[];
  branches: ApiStaffBranch[];
  job_functions: ApiStaffJobFunction[];
  specialties: ApiStaffSpecialty[];
  schedule?: ApiStaffBranchSchedule[];
};

/** @deprecated kept temporarily for code that still imports the old name. */
export type NewApiStaffMember = ApiStaffMember;

/** POST /v1/organizations/:orgId/invitations — flat code arrays, no schedule. */
export type InviteStaffRequest = {
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  role_ids: string[];
  branch_ids: string[];
  job_function_codes?: string[];
  specialty_codes?: string[];
  executive_title?: ExecutiveTitleCode | null;
  engagement_type?: EngagementTypeCode;
};

/** POST /v1/organizations/:orgId/invitations/bulk */
export type BulkInviteStaffRequest = {
  invitations: InviteStaffRequest[];
};

/** POST /v1/organizations/:orgId/staff — direct creation. */
export type CreateStaffDirectRequest = {
  first_name: string;
  last_name: string;
  phone_number: string;
  password: string;
  role_ids: string[];
  branch_ids: string[];
  job_function_codes?: string[];
  specialty_codes?: string[];
  executive_title?: ExecutiveTitleCode | null;
  engagement_type?: EngagementTypeCode;
  schedule?: ApiStaffBranchSchedule[];
};

export type CreateStaffDirectResponse = {
  data: {
    user_id: string;
    profile_id: string;
    organization_id: string;
    generated_email: string;
  };
  meta?: Record<string, unknown>;
};

/** PATCH /v1/organizations/:orgId/staff/:staffProfileId — replace semantics on arrays. */
export type UpdateStaffRequest = {
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  /** OWNER-only — backend 403s if a BRANCH_MANAGER sends this. */
  role_ids?: string[];
  branch_ids?: string[];
  job_function_codes?: string[];
  specialty_codes?: string[];
  executive_title?: ExecutiveTitleCode | null;
  engagement_type?: EngagementTypeCode;
  schedule?: ApiStaffBranchSchedule[];
};

export type ApiResponseEnvelope<T> = T | { data: T; meta?: Record<string, unknown> };

export type ApiStaffMemberResponse = ApiResponseEnvelope<ApiStaffMember>;
/** @deprecated alias kept for older imports. */
export type StaffMemberResponse = ApiStaffMemberResponse;
export type UpdateStaffResponse = ApiStaffMemberResponse;
export type DeactivateStaffResponse = void;

export type StaffInvitationStatus =
  | "pending"
  | "PENDING"
  | "accepted"
  | "ACCEPTED"
  | "expired"
  | "EXPIRED"
  | "cancelled"
  | "CANCELLED"
  | "canceled"
  | "revoked"
  | string;

export type ApiInvitationWorkingSchedule = {
  branch: { id: string; name: string };
  days: Array<{
    day_of_week: string;
    shifts: Array<{ start_time: string; end_time: string }>;
  }>;
};

export type ApiStaffInvitation = {
  id: string;
  organization_id?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string | null;
  executive_title?: ExecutiveTitleCode | null;
  engagement_type?: EngagementTypeCode | null;
  status?: StaffInvitationStatus;
  invited_at?: string | null;
  expires_at?: string | null;
  accepted_at?: string | null;
  created_at?: string;
  updated_at?: string;
  invited_by?: {
    id?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
  };
  roles?: ApiStaffRole[];
  branches?: ApiStaffBranch[];
  job_functions?: ApiStaffJobFunction[];
  specialties?: ApiStaffSpecialty[];
  working_schedule?: ApiInvitationWorkingSchedule[] | null;
  user_exists?: boolean;
  /** @deprecated some endpoints used to nest a single role here */
  role?: ApiStaffRole;
  /** @deprecated some endpoints used to nest a single role name */
  role_name?: string;
};

export type StaffInvitationsMeta = {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  total_pages?: number;
};

export type StaffInvitationsResponse =
  | ApiStaffInvitation[]
  | { data: ApiStaffInvitation[]; meta?: StaffInvitationsMeta };

export type StaffInvitationResponse = ApiResponseEnvelope<ApiStaffInvitation>;

export type StaffInvitationActionResponse = ApiResponseEnvelope<ApiStaffInvitation> & {
  message?: string;
};

export type InviteStaffResponse = ApiResponseEnvelope<ApiStaffInvitation>;

export type BulkInviteResultRow = {
  id: string;
  email: string;
  email_sent: boolean;
};

export type BulkInviteResponse = {
  data: {
    created: number;
    results: BulkInviteResultRow[];
  };
};

export type InvitationPreview = {
  id: string;
  status: string;
  expires_at: string;
  email: string;
  first_name: string;
  last_name: string;
  executive_title?: ExecutiveTitleCode | null;
  engagement_type?: EngagementTypeCode | null;
  organization: { id: string; name: string };
  invited_by: { first_name: string; last_name: string };
  roles: ApiStaffRole[];
  branches: ApiStaffBranch[];
  job_functions?: ApiStaffJobFunction[];
  specialties?: ApiStaffSpecialty[];
};

export type AcceptStaffInviteRequest = {
  invitation_id: string;
  token: string;
  password: string;
  first_name?: string;
  last_name?: string;
  schedule?: ApiStaffBranchSchedule[];
};

export type AcceptStaffInviteResponse = {
  data: {
    authenticated?: true;
    profiles?: import("@/common/types/user.types").UserProfile[];
  };
  meta?: Record<string, unknown>;
};

export type ApiStaffListResponse = {
  data: ApiStaffMember[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type ApiRolesResponse = ApiStaffRole[] | { data: ApiStaffRole[] };

export type ApiJobFunctionsResponse =
  | ApiStaffJobFunction[]
  | { data: ApiStaffJobFunction[] };

export type ApiSpecialtiesResponse =
  | ApiStaffSpecialty[]
  | { data: ApiStaffSpecialty[] };
