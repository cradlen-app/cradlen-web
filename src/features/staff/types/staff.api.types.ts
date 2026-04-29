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
  id: string;
  start_time: string;
  end_time: string;
};

export type ApiStaffDay = {
  id: string;
  day_of_week: "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";
  shifts: ApiStaffShift[];
};

export type ApiStaffSchedule = {
  id: string;
  days: ApiStaffDay[];
};

export type InviteStaffShift = {
  start_time: string;
  end_time: string;
};

export type InviteStaffDay = {
  day_of_week: ApiStaffDay["day_of_week"];
  shifts: InviteStaffShift[];
};

export type InviteStaffBranch = {
  branch_id: string;
  schedule: {
    days: InviteStaffDay[];
  };
};

export type InviteStaffRequest = {
  organization_id: string;
  branches: InviteStaffBranch[];
  role_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  job_title?: string;
  specialty?: string;
};

export type UpdateStaffRequest = {
  first_name?: string;
  last_name?: string;
  phone?: string;
  phone_number?: string;
  role_id?: string;
  job_title?: string;
  specialty?: string;
  branches?: InviteStaffBranch[];
};

export type InviteStaffResponse = {
  data: ApiStaffMember;
  meta?: Record<string, unknown>;
};

export type StaffMemberResponse =
  | ApiStaffMember
  | {
      data: ApiStaffMember;
      meta?: Record<string, unknown>;
    };

export type UpdateStaffResponse = StaffMemberResponse;

export type DeactivateStaffResponse = void;

export type StaffInvitationStatus =
  | "pending"
  | "accepted"
  | "expired"
  | "cancelled"
  | "canceled"
  | "revoked"
  | string;

export type StaffInvitationBranch = {
  id?: string;
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

export type ApiStaffInvitation = {
  id: string;
  organization_id?: string;
  branch_id?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role_id?: string;
  role_name?: string;
  role?: ApiStaffRole;
  job_title?: string;
  specialty?: string;
  status?: StaffInvitationStatus;
  token?: string;
  expires_at?: string;
  expired_at?: string;
  accepted_at?: string;
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
  branches?: StaffInvitationBranch[];
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

export type StaffInvitePreview = {
  id: string;
  organization_id?: string;
  organization_name?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role?: ApiStaffRole;
  role_id?: string;
  role_name?: string;
  job_title?: string;
  specialty?: string;
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
  branches?: StaffInvitationBranch[];
  organization?: {
    id?: string;
    name?: string;
  };
  user_exists: boolean;
};

export type StaffInvitePreviewResponse =
  | StaffInvitePreview
  | {
      data: StaffInvitePreview;
      meta?: Record<string, unknown>;
    };

export type AcceptStaffInviteRequest = {
  invitation_id: string;
  token: string;
  password: string;
};

export type AcceptStaffInviteResponse =
  {
    data: {
      authenticated?: true;
      profiles?: import("@/types/user.types").UserProfile[];
    };
    meta?: Record<string, unknown>;
  };

export type ApiStaffMember = {
  id: string;
  user_id: string;
  organization_id: string;
  branch_id: string;
  role_id: string;
  job_title?: string;
  specialty?: string;
  created_at: string;
  schedule?: ApiStaffSchedule;
  user?: ApiStaffUser;
  role?: ApiStaffRole;
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
