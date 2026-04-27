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

export type InviteStaffResponse = {
  data: ApiStaffMember;
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
  branches?: Array<{
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
  }>;
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
  | {
      access_token: string;
      refresh_token: string;
      token_type?: string;
      expires_in?: number;
    }
  | {
      data: {
        access_token: string;
        refresh_token: string;
        token_type?: string;
        expires_in?: number;
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
