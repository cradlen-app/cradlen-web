export type ApiStaffRole = {
  id: string;
  name: string;
};

export type ApiStaffUser = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  phone?: string;
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
  name: string;
  city?: string;
  governorate?: string;
};

// New staff list item shape from GET /accounts/:accountId/staff
export type NewApiStaffMember = {
  profile_id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  job_title?: string;
  specialty?: string;
  is_clinical?: boolean;
  roles: ApiStaffRole[];
  branches: ApiStaffBranch[];
  schedule: ApiStaffBranchSchedule[];
};

export type InviteStaffShift = {
  start_time: string;
  end_time: string;
};

export type InviteStaffDay = {
  day_of_week: ApiStaffDay["day_of_week"];
  shifts: InviteStaffShift[];
};

// Updated: POST /accounts/:accountId/invitations — flat arrays, no schedule
export type InviteStaffRequest = {
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  job_title?: string;
  specialty?: string;
  is_clinical?: boolean;
  role_ids: string[];
  branch_ids: string[];
};

// POST /accounts/:accountId/staff — direct creation with phone + password
export type CreateStaffDirectRequest = {
  first_name: string;
  last_name: string;
  phone_number: string;
  password: string;
  job_title?: string;
  specialty?: string;
  is_clinical?: boolean;
  role_ids: string[];
  branch_ids: string[];
  schedule?: ApiStaffBranchSchedule[];
};

export type CreateStaffDirectResponse = {
  data: {
    user_id: string;
    profile_id: string;
    account_id: string;
    generated_email: string;
  };
  meta?: Record<string, unknown>;
};

export type UpdateStaffRequest = {
  first_name?: string;
  last_name?: string;
  phone?: string;
  phone_number?: string;
  role_id?: string;
  job_title?: string;
  specialty?: string;
  branches?: Array<{
    branch_id: string;
    schedule: { days: InviteStaffDay[] };
  }>;
};

export type InviteStaffResponse = {
  data: ApiStaffInvitation;
  meta?: Record<string, unknown>;
};

export type StaffMemberResponse =
  | NewApiStaffMember
  | {
      data: NewApiStaffMember;
      meta?: Record<string, unknown>;
    };

export type UpdateStaffResponse = StaffMemberResponse;

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

export type StaffInvitationBranch = {
  id?: string;
  name?: string;
  city?: string;
  governorate?: string;
  branch_id?: string;
  branch_name?: string;
  branch?: {
    id?: string;
    name?: string;
    address?: string;
    city?: string;
    governorate?: string;
    country?: string;
    is_main?: boolean;
  };
  schedule?: {
    id?: string;
    days: InviteStaffDay[];
  };
};

export type ApiInvitationWorkingSchedule = {
  branch: { id: string; name: string };
  days: Array<{
    day_of_week: string;
    shifts: Array<{ start_time: string; end_time: string }>;
  }>;
};

export type ApiStaffInvitation = {
  id: string;
  account_id?: string;
  organization_id?: string;
  branch_id?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  phone_number?: string | null;
  job_title?: string | null;
  specialty?: string | null;
  is_clinical?: boolean;
  role_id?: string;
  role_name?: string;
  role?: ApiStaffRole;
  roles?: ApiStaffRole[];
  branches?: StaffInvitationBranch[];
  working_schedule?: ApiInvitationWorkingSchedule[] | null;
  status?: StaffInvitationStatus;
  token?: string;
  expires_at?: string;
  expired_at?: string;
  accepted_at?: string | null;
  created_at?: string;
  updated_at?: string;
  sent_at?: string;
  invited_at?: string;
  invited_by?: {
    id?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
  };
  inviter?: {
    id?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
  };
  created_by?: {
    id?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
  };
  organization?: {
    id?: string;
    name?: string;
  };
  user_exists?: boolean;
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
  | {
      data: ApiStaffInvitation[];
      meta?: StaffInvitationsMeta;
    };

export type StaffInvitationResponse =
  | ApiStaffInvitation
  | {
      data: ApiStaffInvitation;
      meta?: Record<string, unknown>;
    };

export type StaffInvitationActionResponse =
  | ApiStaffInvitation
  | {
      data?: ApiStaffInvitation;
      message?: string;
      meta?: Record<string, unknown>;
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
    profiles?: import("@/types/user.types").UserProfile[];
  };
  meta?: Record<string, unknown>;
};

// Legacy type kept for updateStaff/deactivateStaff which haven't been migrated yet
export type ApiStaffMember = Omit<NewApiStaffMember, "schedule"> & {
  id?: string;
  organization_id?: string;
  branch_id?: string;
  role_id?: string;
  created_at?: string;
  schedule?: ApiStaffSchedule | ApiStaffBranchSchedule[];
  user?: ApiStaffUser;
  role?: ApiStaffRole;
};

export type ApiStaffListResponse = {
  data: NewApiStaffMember[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type ApiRolesResponse = ApiStaffRole[] | { data: ApiStaffRole[] };
