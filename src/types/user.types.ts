export type UserRole = "owner" | "receptionist" | "doctor" | "patient";

export type UserProfile = {
  staff_id: string;
  job_title: string;
  specialty?: string;
  is_clinical?: boolean;
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
    country?: string;
    governorate: string;
    is_main: boolean;
  };
};

export type CurrentUser = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  phone_number?: string | null;
  is_active: boolean;
  verified_at: string;
  created_at: string;
  profiles: UserProfile[];
};
