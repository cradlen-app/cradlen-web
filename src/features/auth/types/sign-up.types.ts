export type Step1Data = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  isClinical: boolean;
  specialty?: string;
};

export type Step2Data = {
  verificationCode: string;
};

export type Step3Data = {
  organizationName: string;
  specialties: string;
  city: string;
  address: string;
  governorate: string;
  country: string;
};

export type SignUpFormData = Omit<Step3Data, "specialties"> &
  Step1Data &
  Step2Data & { specialties: string[] };

// API request types (snake_case matching backend DTOs)
type ApiResponse<T> = { data: T; meta: Record<string, unknown> };

export type RegisterPersonalRequest = {
  first_name: string;
  last_name: string;
  phone_number: string;
  email: string;
  password: string;
  confirm_password: string;
  is_clinical: boolean;
  speciality?: string;
};

export type VerifyEmailRequest = {
  registration_token: string;
  code: string;
};

export type RegisterOrganizationRequest = {
  registration_token: string;
  organization_name: string;
  organization_specialities?: string[];
  branch_address: string;
  branch_city: string;
  branch_governorate: string;
};

export type ResendOtpRequest = {
  registration_token: string;
};

export type RegistrationTokenData = {
  registration_token: string;
  expires_in: number;
};

export type RegistrationTokenResponse = ApiResponse<RegistrationTokenData>;

export type RegisterOrganizationResponse = ApiResponse<{
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}>;

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

export type LoginResponse = ApiResponse<AuthTokens | PendingLoginResponse>;
