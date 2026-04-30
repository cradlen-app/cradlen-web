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

export type UserProfileRole = {
  id: string;
  name: BackendUserRole | string;
};

export type UserProfile = {
  staff_id: string;
  job_title: string;
  specialty?: string;
  is_clinical?: boolean;
  roles: UserProfileRole[];
  organization: {
    id: string;
    name: string;
    specialities: string[];
    status: string;
  };
  branches: UserBranch[];
  /** @deprecated — not returned by /auth/me; use roles[0] */
  role?: { id?: string; name: UserRole | BackendUserRole | string };
  /** @deprecated — not returned by /auth/me; use branches[0] */
  branch?: UserBranch;
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
