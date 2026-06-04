export type PatientLoginRequest = {
  national_id: string;
  password: string;
};

export type PatientSignupStartRequest = {
  national_id: string;
  date_of_birth: string; // YYYY-MM-DD
  phone_number: string;
};

export type PatientSignupCompleteRequest = {
  password: string;
  confirm_password: string;
};

export type PatientAuthenticatedResponse = {
  data: { authenticated: boolean };
  meta: Record<string, unknown>;
};

export type PatientSignupStartResponse = {
  data: { expires_in: number | null };
  meta: Record<string, unknown>;
};

export type PatientIdentity = {
  user_id: string;
  patient_id: string | null;
  guardian_id: string | null;
  accessible_patient_ids: string[];
};

export type PatientMeResponse = {
  data: PatientIdentity;
  meta: Record<string, unknown>;
};
