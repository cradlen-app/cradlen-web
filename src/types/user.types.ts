export type UserRole = "owner" | "receptionist" | "doctor";

export type UserProfile = {
  staff_id: string;
  job_title: string;
  role: { id: string; name: UserRole };
  organization: {
    id: string;
    name: string;
    specialities: string[];
    status: string;
  };
  branch: {
    id: string;
    address: string;
    city: string;
    governorate: string;
    is_main: boolean;
  };
};

export type CurrentUser = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
  verified_at: string;
  created_at: string;
  profiles: UserProfile[];
};
