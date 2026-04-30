import type {
  RegisterOrganizationRequest,
  Step3Data,
} from "../types/sign-up.types";

export function buildRegisterOrganizationRequest(
  data: Step3Data,
  signupToken: string,
): RegisterOrganizationRequest {
  const accountSpecialities = data.specialties
    .split(",")
    .map((specialty) => specialty.trim())
    .filter(Boolean);
  const isClinical = data.role === "owner_doctor";
  const specialty = data.specialty?.trim();
  const jobTitle = data.jobTitle?.trim();

  const payload: RegisterOrganizationRequest = {
    signup_token: signupToken,
    account_name: data.accountName,
    specialties: accountSpecialities,
    branch_name: data.accountName,
    roles: isClinical ? ["OWNER", "DOCTOR"] : ["OWNER"],
  };

  if (isClinical && specialty) payload.specialty = specialty;
  if (isClinical && jobTitle) payload.job_title = jobTitle;

  return payload;
}
