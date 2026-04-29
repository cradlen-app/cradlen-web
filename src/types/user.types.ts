export type BackendUserRole = "OWNER" | "DOCTOR" | "RECEPTIONIST";

export type UserRole =
  | "owner"
  | "reception"
  | "receptionist"
  | "doctor"
  | "patient"
  | "unknown";

export type UserBranch = {
  id: string;
  branch_id?: string;
  name?: string;
  address: string;
  city: string;
  country?: string;
  governorate: string;
  is_main: boolean;
};

export type UserProfile = {
  id?: string;
  profile_id?: string;
  account_id?: string;
  account_name?: string;
  staff_id: string;
  job_title: string;
  specialty?: string;
  is_clinical?: boolean;
  roles?: string[];
  role: { id?: string; name: UserRole | BackendUserRole | string };
  account?: {
    id: string;
    name: string;
    specialities?: string[];
    status?: string;
  };
  organization: {
    id: string;
    name: string;
    specialities: string[];
    status: string;
  };
  branch: UserBranch;
  branches?: UserBranch[];
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
