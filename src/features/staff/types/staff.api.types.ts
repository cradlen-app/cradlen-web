export type ApiStaffRole = {
  id: string;
  name: "owner" | "receptionist" | "doctor";
};

export type ApiStaffUser = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
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
