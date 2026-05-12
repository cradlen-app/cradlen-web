export type BackendUserRole = "OWNER" | "DOCTOR" | "RECEPTIONIST";

export type UserRole = "owner" | "reception" | "doctor" | "patient" | "unknown";

export type ExecutiveTitle = "CEO" | "COO" | "CFO" | "CMO";

export type EngagementType =
  | "FULL_TIME"
  | "PART_TIME"
  | "ON_DEMAND"
  | "EXTERNAL_CONSULTANT";

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

export type UserSpecialty = {
  id: string;
  code: string;
  name: string;
};

export type UserJobFunction = {
  id: string;
  code: string;
  name: string;
  is_clinical: boolean;
};

export type UserProfile = {
  staff_id: string;
  job_title?: string;
  executive_title?: ExecutiveTitle | null;
  engagement_type?: EngagementType | null;
  phone_number?: string | null;
  phone?: string | null;
  /** /auth/me returns role objects; login/signup returns role name strings */
  roles: (UserProfileRole | string)[];
  organization: {
    id: string;
    name: string;
    /** /auth/me returns full specialty objects; login/signup may return strings */
    specialties?: (UserSpecialty | string)[];
    /** @deprecated misspelling — backend field is `specialties`; kept for back-compat */
    specialities?: string[];
    status: string;
  };
  branches: UserBranch[];
  /** Profile-level specialties (subset of org specialties) */
  specialties?: UserSpecialty[];
  /** Profile-level job functions; `is_clinical` lives here, not at the profile root */
  job_functions?: UserJobFunction[];
  /** @deprecated login/signup response only — /auth/me uses staff_id */
  profile_id?: string;
  /** @deprecated login/signup response only — /auth/me uses organization.name */
  organization_name?: string;
  /** @deprecated login/signup response only — /auth/me uses organization.id */
  organization_id?: string;
  /** @deprecated not returned by /auth/me; use roles[0] */
  role?: { id?: string; name: UserRole | BackendUserRole | string };
  /** @deprecated not returned by /auth/me; use branches[0] */
  branch?: UserBranch;
  /** @deprecated /auth/me nests this in job_functions[].is_clinical */
  is_clinical?: boolean;
  /** @deprecated /auth/me uses specialties[]; staff endpoints still expose this */
  specialty?: string;
};

export type CurrentUser = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  phone_number?: string | null;
  is_active: boolean;
  verified_at: string | null;
  created_at: string;
  /**
   * /auth/me always returns the active profile only, so this array has length 1.
   * To enumerate all of a user's profiles, use the `profiles[]` from /auth/login
   * or /auth/signup/complete instead.
   */
  profiles: UserProfile[];
};
