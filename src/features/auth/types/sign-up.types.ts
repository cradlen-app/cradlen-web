import type { UserProfile } from "@/types/user.types";

export type Step1Data = {
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type Step2Data = {
  verificationCode: string;
};

export type Step3Data = {
  accountName: string;
  specialties: string;
  city: string;
  address: string;
  governorate: string;
  country: string;
  role: "owner" | "owner_doctor";
  specialty?: string;
  jobTitle?: string;
};

export type SignUpFormData = Omit<Step3Data, "specialties"> &
  Step1Data &
  Step2Data & { specialties: string[] };

// API request types (snake_case matching backend DTOs)
type ApiResponse<T> = { data: T; meta: Record<string, unknown> };

export type RegisterPersonalRequest = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  confirm_password: string;
  phone_number?: string;
};

export type VerifyEmailRequest = {
  email: string;
  code: string;
};

export type RegisterOrganizationRequest = {
  email: string;
  account_name: string;
  account_specialities?: string[];
  branch_name: string;
  branch_address: string;
  branch_city: string;
  branch_governorate: string;
  branch_country?: string;
  roles: ("OWNER" | "DOCTOR")[];
  is_clinical: boolean;
  specialty?: string;
  job_title?: string;
};

export type ResendOtpRequest = {
  email: string;
};

export type RegistrationStep =
  | "NONE"
  | "VERIFY_OTP"
  | "COMPLETE_ONBOARDING"
  | "DONE";

export type RegistrationStatusResponse = {
  step: RegistrationStep;
};

export type RegistrationTokenData = {
  signup_token?: string;
  registration_token?: string;
  expires_in: number;
};

export type RegistrationTokenResponse = ApiResponse<RegistrationTokenData>;

export type AuthenticatedSession = { authenticated: true };

export type RegisterOrganizationResponse = ApiResponse<AuthenticatedSession>;

export type SignupCompleteResponse = ApiResponse<{ profiles: UserProfile[] }>;

export type PendingLoginResponse = {
  registration_token: string;
  expires_in: number;
  pending_step: "verify_email" | "organization";
};

export type AuthTokens = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
};

export type LoginResponse = ApiResponse<
  AuthenticatedSession | AuthTokens | PendingLoginResponse
>;
